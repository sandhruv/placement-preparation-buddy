"""LangGraph workflow for the interview process."""
from typing import TypedDict, Annotated, List, Optional
from langgraph.graph import StateGraph, END


class InterviewState(TypedDict):
    """State for the interview workflow."""
    candidate_id: Optional[str]
    interview_id: Optional[str]
    resume_text: str
    target_role: str
    researched_requirements: List[str]
    skill_gaps: List[dict]
    evaluation_plan: List[dict]
    covered_skills: List[str]
    current_topic: str
    current_question: str
    candidate_answer: str
    answer_evaluation: Optional[dict]
    follow_up_required: bool
    follow_up_count: int
    current_question_number: int
    max_questions: int
    transcript: List[dict]
    completed_topics: List[str]
    interview_status: str
    interviewer_message: str


def create_interview_graph():
    """Create the LangGraph state graph for the interview."""
    graph = StateGraph(InterviewState)

    # Define nodes (functions)
    graph.add_node("generate_question", _generate_question_node)
    graph.add_node("evaluate_answer", _evaluate_answer_node)
    graph.add_node("generate_followup", _generate_followup_node)
    graph.add_node("choose_next_topic", _choose_next_topic_node)

    # Set entry point
    graph.set_entry_point("generate_question")

    # Edges from generate_question
    graph.add_edge("generate_question", "evaluate_answer")

    # Conditional edge from evaluate_answer
    graph.add_conditional_edges(
        "evaluate_answer",
        _should_followup,
        {
            "followup": "generate_followup",
            "next_topic": "choose_next_topic",
            "end": END,
        },
    )

    # Follow-up goes back to evaluate_answer
    graph.add_edge("generate_followup", "evaluate_answer")

    # Choose next topic goes back to generate_question
    graph.add_edge("choose_next_topic", "generate_question")

    return graph.compile()


# --- Node implementations (these are called by the graph, actual logic is in routes) ---
# The actual AI calls happen in routes.py; these nodes just pass state through.

def _generate_question_node(state: dict) -> dict:
    """Node: generate question (logic handled in routes.py)."""
    return {"current_question": state.get("current_question", "")}


def _evaluate_answer_node(state: dict) -> dict:
    """Node: evaluate answer (logic handled in routes.py)."""
    return {"answer_evaluation": state.get("answer_evaluation")}


def _generate_followup_node(state: dict) -> dict:
    """Node: generate follow-up (logic handled in routes.py)."""
    return {"current_question": state.get("current_question", "")}


def _choose_next_topic_node(state: dict) -> dict:
    """Node: choose next topic (logic handled in routes.py)."""
    return {"current_topic": state.get("current_topic", "")}


def _should_followup(state: dict) -> str:
    """Decide whether to follow up or move to next topic."""
    if state.get("follow_up_required") and state.get("follow_up_count", 0) < 3:
        return "followup"
    if state.get("current_question_number", 0) >= state.get("max_questions", 10):
        return "end"
    return "next_topic"
