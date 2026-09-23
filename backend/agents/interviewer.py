"""Interviewer Agent - Conducts the mock interview dynamically."""
import os
import json
from groq import Groq


_client = None


def _get_groq_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


def gap_analysis(resume_text: str, target_role: str, researched_requirements: list) -> dict:
    """
    Analyze resume against researched requirements to identify skill gaps.

    Returns:
        dict with skill_gaps and evaluation_plan
    """
    client = _get_groq_client()

    prompt = f"""You are an expert technical interviewer analyzing a candidate's resume against job requirements.

CANDIDATE RESUME:
{resume_text}

TARGET ROLE: {target_role}

RESEARCHED JOB REQUIREMENTS:
{json.dumps(researched_requirements, indent=2)}

Your task:
1. Compare the resume skills against the researched requirements.
2. Identify exactly 2-3 specific skill gaps or areas that need verification.
3. For each gap, classify it as "needs_verification" (skill not clearly demonstrated) or "missing" (skill not present).

Return a JSON object with this exact format:
{{
    "skill_gaps": [
        {{
            "skill": "skill name",
            "status": "needs_verification or missing",
            "description": "brief explanation of why this is a gap"
        }}
    ],
    "evaluation_plan": [
        {{
            "topic": "topic to cover",
            "reason": "why this needs to be evaluated"
        }}
    ],
    "covered_skills": [
        "skills from requirements that ARE clearly demonstrated in the resume"
    ]
}}

IMPORTANT: Return ONLY the JSON object, no other text."""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1500,
    )

    result_text = response.choices[0].message.content.strip()

    # Parse JSON from response
    try:
        # Try to extract JSON from the response
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
        return json.loads(result_text)
    except json.JSONDecodeError:
        # Fallback: create a basic structure
        return {
            "skill_gaps": [
                {"skill": "Technical depth", "status": "needs_verification",
                 "description": "Need to verify depth of technical knowledge through interview"},
                {"skill": "Problem solving", "status": "needs_verification",
                 "description": "Need to assess problem-solving approach"},
                {"skill": "System design", "status": "needs_verification",
                 "description": "Need to evaluate system design understanding"},
            ],
            "evaluation_plan": [
                {"topic": "Core technical skills", "reason": "Verify hands-on proficiency"},
                {"topic": "System design", "reason": "Assess architectural thinking"},
                {"topic": "Problem solving", "reason": "Evaluate analytical approach"},
            ],
            "covered_skills": [],
        }


def generate_question(
    resume_text: str,
    target_role: str,
    researched_requirements: list,
    skill_gaps: list,
    current_topic: str,
    transcript: list,
    follow_up_count: int,
) -> str:
    """Generate an interview question based on context."""
    client = _get_groq_client()

    # Build conversation history
    history = ""
    for entry in transcript:
        role_label = "Interviewer" if entry["role"] == "interviewer" else "Candidate"
        history += f"{role_label}: {entry['content']}\n"

    prompt = f"""You are a professional technical interviewer conducting a mock interview.

CANDIDATE RESUME SUMMARY:
{resume_text[:500]}

TARGET ROLE: {target_role}

KEY REQUIREMENTS: {', '.join([r for r in researched_requirements[:8]])}

SKILL GAPS TO TEST: {', '.join([g['skill'] for g in skill_gaps])}

CURRENT TOPIC: {current_topic}

{f'CONVERSATION SO FAR:{chr(10)}{history}' if history else ''}

FOLLOW-UP COUNT for this topic: {follow_up_count}

INSTRUCTIONS:
- Generate a single, clear interview question.
- The question should be related to the CURRENT TOPIC.
- Make it specific and practical (not theoretical textbook questions).
- Ask about real-world scenarios when possible.
- If follow_up_count > 0, ask a more targeted follow-up on the weak area.
- Do NOT greet or use pleasantries. Just ask the question directly.
- Keep it concise (1-3 sentences max).

Return ONLY the question text, nothing else."""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=300,
    )

    return response.choices[0].message.content.strip()


def generate_followup(
    original_question: str,
    candidate_answer: str,
    weak_areas: list,
    current_topic: str,
) -> str:
    """Generate a targeted follow-up question for a weak answer."""
    client = _get_groq_client()

    prompt = f"""You are a professional technical interviewer. The candidate gave a weak/incomplete answer. Generate a targeted follow-up question.

ORIGINAL QUESTION: {original_question}
CANDIDATE'S ANSWER: {candidate_answer}
WEAK AREAS DETECTED: {', '.join(weak_areas)}
CURRENT TOPIC: {current_topic}

INSTRUCTIONS:
- Ask a targeted follow-up that addresses the specific weak area.
- Be direct and professional.
- Do NOT rephrase the original question.
- Focus on the gap in the candidate's answer.
- Keep it to 1-2 sentences.

Return ONLY the follow-up question, nothing else."""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=200,
    )

    return response.choices[0].message.content.strip()


def evaluate_answer(
    question: str,
    answer: str,
    current_topic: str,
    target_role: str,
) -> dict:
    """
    Evaluate a candidate's answer and decide if follow-up is needed.

    Returns:
        dict with evaluation, is_strong, weak_areas, feedback
    """
    client = _get_groq_client()

    prompt = f"""You are evaluating a candidate's interview answer.

QUESTION: {question}
CANDIDATE'S ANSWER: {answer}
TOPIC: {current_topic}
TARGET ROLE: {target_role}

Evaluate the answer on:
1. Completeness - Did they cover the key points?
2. Accuracy - Is the information correct?
3. Depth - Do they demonstrate real understanding?
4. Clarity - Is the explanation clear?

Return a JSON object:
{{
    "is_strong": true/false,
    "score": 1-10,
    "completeness": 1-10,
    "accuracy": 1-10,
    "depth": 1-10,
    "weak_areas": ["list of specific weak areas if any"],
    "feedback": "brief constructive feedback (1 sentence)"
}}

Return ONLY the JSON object."""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=500,
    )

    result_text = response.choices[0].message.content.strip()

    try:
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
        return json.loads(result_text)
    except json.JSONDecodeError:
        # Default: assume answer is acceptable
        return {
            "is_strong": True,
            "score": 6,
            "completeness": 6,
            "accuracy": 6,
            "depth": 5,
            "weak_areas": [],
            "feedback": "Answer provided. Moving to next topic.",
        }


def choose_next_topic(
    evaluation_plan: list,
    completed_topics: list,
    transcript: list,
    target_role: str,
) -> str:
    """Choose the next interview topic based on what's been covered."""
    client = _get_groq_client()

    history = ""
    for entry in transcript[-6:]:  # Last 6 entries for context
        role_label = "Interviewer" if entry["role"] == "interviewer" else "Candidate"
        history += f"{role_label}: {entry['content']}\n"

    prompt = f"""You are managing the flow of a technical interview.

TARGET ROLE: {target_role}
EVALUATION PLAN: {json.dumps(evaluation_plan, indent=2)}
COMPLETED TOPICS: {json.dumps(completed_topics)}
RECENT CONVERSATION:
{history}

Choose the NEXT topic to cover. Pick from the evaluation plan that hasn't been completed yet.
If all topics are covered, return "DONE".

Return ONLY the topic string, nothing else."""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=100,
    )

    return response.choices[0].message.content.strip()
