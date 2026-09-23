"""API Routes for Placement Prep Buddy."""
import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from auth import get_current_user
from tools.resume_parser import extract_text_from_pdf
from tools.tavily_search import research_role_requirements
from agents.interviewer import gap_analysis, generate_question, generate_followup, evaluate_answer, choose_next_topic
from agents.evaluator import evaluate_interview
from database.mongodb import (
    create_candidate, create_interview, update_interview,
    append_to_transcript, save_evaluation, get_interview, get_evaluation,
)

router = APIRouter()

# In-memory store for interview states (graph state)
# In production, use Redis or similar
interview_states = {}


class AnswerRequest(BaseModel):
    answer: str


class StartRequest(BaseModel):
    target_role: str


# ============================================================
# POST /api/interview/start - Start a new interview session
# ============================================================
@router.post("/interview/start")
async def start_interview(
    resume: UploadFile = File(...),
    target_role: str = Form(...),
    user: dict = Depends(get_current_user),
):
    """Start a new interview: parse resume, research role, generate gaps."""
    # Validate file
    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are accepted")

    if resume.size and resume.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 5MB")

    target_role = (target_role or "").strip()
    if len(target_role) < 2 or len(target_role) > 60:
        raise HTTPException(status_code=400, detail="Target role must be 2-60 characters")

    # Save uploaded file temporarily
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await resume.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Extract resume text
        resume_text = extract_text_from_pdf(tmp_path)

        if not resume_text or len(resume_text.strip()) < 20:
            raise HTTPException(status_code=400, detail="Could not extract enough text from the resume")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process PDF: {str(e)}")
    finally:
        # Clean up temp file
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)

    # Research role requirements using Tavily
    research = research_role_requirements(target_role)
    researched_requirements = research.get("requirements", [])

    # Perform gap analysis using Groq
    gaps = gap_analysis(resume_text, target_role, researched_requirements)

    skill_gaps = gaps.get("skill_gaps", [])
    evaluation_plan = gaps.get("evaluation_plan", [])
    covered_skills = gaps.get("covered_skills", [])

    # Save to MongoDB
    candidate = create_candidate(
        target_role=target_role,
        resume_text=resume_text,
        skill_gaps=skill_gaps,
        researched_requirements=researched_requirements,
    )

    # Create evaluation plan for display
    evaluation_plan_display = []
    for skill in covered_skills:
        evaluation_plan_display.append({
            "topic": skill,
            "status": "covered",
            "description": f"{skill} — clearly demonstrated in resume",
        })
    for gap in skill_gaps:
        evaluation_plan_display.append({
            "topic": gap["skill"],
            "status": gap.get("status", "needs_verification"),
            "description": gap.get("description", f"{gap['skill']} — needs verification"),
        })

    # Create interview record
    interview = create_interview(
        candidate_id=candidate["_id"],
        target_role=target_role,
        evaluation_plan=evaluation_plan,
    )

    # Initialize interview state
    first_topic = evaluation_plan[0]["topic"] if evaluation_plan else "Technical Skills"
    state = {
        "candidate_id": candidate["_id"],
        "interview_id": interview["_id"],
        "resume_text": resume_text,
        "target_role": target_role,
        "researched_requirements": researched_requirements,
        "skill_gaps": skill_gaps,
        "evaluation_plan": evaluation_plan,
        "covered_skills": covered_skills,
        "current_topic": first_topic,
        "current_question": "",
        "candidate_answer": "",
        "answer_evaluation": None,
        "follow_up_required": False,
        "follow_up_count": 0,
        "current_question_number": 1,
        "max_questions": 10,
        "transcript": [],
        "completed_topics": [],
        "interview_status": "in_progress",
        "interviewer_message": "",
    }

    # Generate first question
    question = generate_question(
        resume_text=resume_text,
        target_role=target_role,
        researched_requirements=researched_requirements,
        skill_gaps=skill_gaps,
        current_topic=first_topic,
        transcript=[],
        follow_up_count=0,
    )

    state["current_question"] = question
    state["interviewer_message"] = question

    # Add to transcript
    state["transcript"].append({"role": "interviewer", "content": question})
    append_to_transcript(interview["_id"], {"role": "interviewer", "content": question})

    # Store state
    interview_states[interview["_id"]] = state

    return {
        "interview_id": interview["_id"],
        "candidate_id": candidate["_id"],
        "evaluation_plan": evaluation_plan_display,
        "first_question": question,
        "target_role": target_role,
    }


# ============================================================
# POST /api/interview/{interview_id}/answer - Submit answer
# ============================================================
@router.post("/interview/{interview_id}/answer")
async def submit_answer(interview_id: str, request: AnswerRequest, user: dict = Depends(get_current_user)):
    """Submit a candidate answer and get the next question."""
    # Get state
    state = interview_states.get(interview_id)
    if not state:
        # Try loading from MongoDB
        interview = get_interview(interview_id)
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        raise HTTPException(status_code=400, detail="Interview state expired. Please start a new interview.")

    answer = request.answer.strip()
    if not answer:
        raise HTTPException(status_code=400, detail="Answer cannot be empty")

    # Add candidate answer to transcript
    state["transcript"].append({"role": "candidate", "content": answer})
    append_to_transcript(interview_id, {"role": "candidate", "content": answer})

    # Evaluate the answer
    evaluation = evaluate_answer(
        question=state["current_question"],
        answer=answer,
        current_topic=state["current_topic"],
        target_role=state["target_role"],
    )

    state["answer_evaluation"] = evaluation
    state["candidate_answer"] = answer

    is_strong = evaluation.get("is_strong", True)
    weak_areas = evaluation.get("weak_areas", [])

    # Decision: follow-up or next topic
    if not is_strong and state["follow_up_count"] < 3:
        # Generate targeted follow-up
        state["follow_up_required"] = True
        state["follow_up_count"] += 1

        followup_q = generate_followup(
            original_question=state["current_question"],
            candidate_answer=answer,
            weak_areas=weak_areas,
            current_topic=state["current_topic"],
        )

        state["current_question"] = followup_q
        state["interviewer_message"] = followup_q
        state["transcript"].append({"role": "interviewer", "content": followup_q})
        append_to_transcript(interview_id, {"role": "interviewer", "content": followup_q})

    else:
        # Move to next topic
        state["follow_up_required"] = False
        state["follow_up_count"] = 0
        state["completed_topics"].append(state["current_topic"])
        state["current_question_number"] += 1

        # Check if interview should end
        if state["current_question_number"] > state["max_questions"] or len(state["completed_topics"]) >= len(state["evaluation_plan"]):
            state["interview_status"] = "completed"
            state["transcript"].append({
                "role": "interviewer",
                "content": "Thank you for your answers. The interview is now complete. I'll generate your evaluation report.",
            })
            append_to_transcript(interview_id, {
                "role": "interviewer",
                "content": "Thank you for your answers. The interview is now complete. I'll generate your evaluation report.",
            })
            interview_states[interview_id] = state
            return {
                "type": "interview_complete",
                "message": "Interview completed. Click to view your results.",
                "next_question": None,
                "evaluation": evaluation,
            }

        # Choose next topic
        next_topic = choose_next_topic(
            evaluation_plan=state["evaluation_plan"],
            completed_topics=state["completed_topics"],
            transcript=state["transcript"],
            target_role=state["target_role"],
        )

        if next_topic == "DONE":
            state["interview_status"] = "completed"
            state["transcript"].append({
                "role": "interviewer",
                "content": "Thank you for your answers. The interview is now complete.",
            })
            append_to_transcript(interview_id, {
                "role": "interviewer",
                "content": "Thank you for your answers. The interview is now complete.",
            })
            interview_states[interview_id] = state
            return {
                "type": "interview_complete",
                "message": "Interview completed. Click to view your results.",
                "next_question": None,
                "evaluation": evaluation,
            }

        state["current_topic"] = next_topic

        # Generate next question
        next_question = generate_question(
            resume_text=state["resume_text"],
            target_role=state["target_role"],
            researched_requirements=state["researched_requirements"],
            skill_gaps=state["skill_gaps"],
            current_topic=next_topic,
            transcript=state["transcript"],
            follow_up_count=0,
        )

        state["current_question"] = next_question
        state["interviewer_message"] = next_question
        state["transcript"].append({"role": "interviewer", "content": next_question})
        append_to_transcript(interview_id, {"role": "interviewer", "content": next_question})

    interview_states[interview_id] = state

    return {
        "type": "question",
        "next_question": state["current_question"],
        "question_number": state["current_question_number"],
        "current_topic": state["current_topic"],
        "evaluation": evaluation,
    }


# ============================================================
# POST /api/interview/{interview_id}/finish - End interview
# ============================================================
@router.post("/interview/{interview_id}/finish")
async def finish_interview(interview_id: str, user: dict = Depends(get_current_user)):
    """End the interview and generate evaluation."""
    state = interview_states.get(interview_id)
    if not state:
        interview = get_interview(interview_id)
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        # Try to evaluate from stored transcript
        transcript = interview.get("transcript", [])
        target_role = interview.get("target_role", "")
        skill_gaps = interview.get("skill_gaps", [])
    else:
        transcript = state["transcript"]
        target_role = state["target_role"]
        skill_gaps = state["skill_gaps"]

    if not transcript:
        raise HTTPException(status_code=400, detail="No transcript available for evaluation")

    # Run evaluator agent
    evaluation = evaluate_interview(transcript, target_role, skill_gaps)

    # Save evaluation to MongoDB
    eval_record = save_evaluation(interview_id, evaluation)

    # Update interview status
    update_interview(interview_id, {"status": "completed", "end_time": __import__("datetime").datetime.now(__import__("datetime").timezone.utc)})

    # Clean up in-memory state
    if interview_id in interview_states:
        del interview_states[interview_id]

    return {
        "evaluation": evaluation,
        "transcript": transcript,
        "interview_id": interview_id,
    }


# ============================================================
# GET /api/interview/{interview_id} - Get interview data
# ============================================================
@router.get("/interview/{interview_id}")
async def get_interview_data(interview_id: str, user: dict = Depends(get_current_user)):
    """Get interview transcript and status."""
    interview = get_interview(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    evaluation = get_evaluation(interview_id)

    return {
        "interview": interview,
        "evaluation": evaluation,
    }


# ============================================================
# GET /api/evaluation/{interview_id} - Get evaluation
# ============================================================
@router.get("/evaluation/{interview_id}")
async def get_evaluation_data(interview_id: str, user: dict = Depends(get_current_user)):
    """Get the final evaluation for an interview."""
    evaluation = get_evaluation(interview_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    return {"evaluation": evaluation}
