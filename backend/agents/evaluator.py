"""Evaluator Agent - Independently evaluates the completed interview."""
import os
import json
from groq import Groq


_client = None


def _get_groq_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


def evaluate_interview(transcript: list, target_role: str, skill_gaps: list) -> dict:
    """
    Independently evaluate the completed interview and generate a report.

    Args:
        transcript: Complete interview transcript (list of {role, content} dicts)
        target_role: The target job role
        skill_gaps: The identified skill gaps

    Returns:
        Structured evaluation report
    """
    client = _get_groq_client()

    # Format transcript
    transcript_text = ""
    for entry in transcript:
        role_label = "Interviewer" if entry["role"] == "interviewer" else "Candidate"
        transcript_text += f"{role_label}: {entry['content']}\n\n"

    skill_gaps_text = ", ".join([g.get("skill", "Unknown") for g in skill_gaps])

    prompt = f"""You are an expert interview evaluator. Analyze this completed mock interview and provide a comprehensive evaluation.

TARGET ROLE: {target_role}
IDENTIFIED SKILL GAPS TO TEST: {skill_gaps_text}

COMPLETE INTERVIEW TRANSCRIPT:
{transcript_text}

Evaluate the candidate on these dimensions:

1. TECHNICAL KNOWLEDGE (1-10): Core technical skills for the role
2. PROBLEM SOLVING (1-10): Approach to problems, analytical thinking
3. COMMUNICATION (1-10): Clarity, structure, professionalism of responses
4. ROLE-SPECIFIC KNOWLEDGE (1-10): Domain knowledge for the target role
5. DEPTH OF UNDERSTANDING (1-10): Shows genuine understanding vs surface-level

Return a JSON object:
{{
    "scores": {{
        "technical_knowledge": 7,
        "problem_solving": 6,
        "communication": 8,
        "role_knowledge": 7,
        "depth_of_understanding": 6
    }},
    "strengths": [
        "Specific strength 1 with evidence from transcript",
        "Specific strength 2"
    ],
    "areas_to_improve": [
        "Specific area 1 with actionable advice",
        "Specific area 2"
    ],
    "overall_feedback": "A comprehensive 2-3 sentence summary of the candidate's performance, highlighting key observations and recommendations."
}}

IMPORTANT:
- Base your evaluation ONLY on what was said in the transcript
- Be fair but honest
- Provide specific examples from the transcript
- Return ONLY the JSON object, no other text"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000,
    )

    result_text = response.choices[0].message.content.strip()

    try:
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
        return json.loads(result_text)
    except json.JSONDecodeError:
        # Fallback evaluation
        return {
            "scores": {
                "technical_knowledge": 5,
                "problem_solving": 5,
                "communication": 5,
                "role_knowledge": 5,
                "depth_of_understanding": 5,
            },
            "strengths": ["Participated in the full interview"],
            "areas_to_improve": ["Unable to generate specific feedback due to parsing error"],
            "overall_feedback": "The interview was completed. Please review the transcript for detailed assessment.",
        }
