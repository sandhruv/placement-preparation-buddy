"""MongoDB connection and operations."""
import os
from datetime import datetime, timezone
from pymongo import MongoClient
from bson import ObjectId


_client = None
_db = None


def get_db():
    """Get MongoDB database instance (lazy connection)."""
    global _client, _db
    if _db is None:
        uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        _client = MongoClient(uri)
        _db = _client["placement_prep_buddy"]
    return _db


def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict."""
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    if "interview_id" in doc and isinstance(doc["interview_id"], ObjectId):
        doc["interview_id"] = str(doc["interview_id"])
    if "candidate_id" in doc and isinstance(doc["candidate_id"], ObjectId):
        doc["candidate_id"] = str(doc["candidate_id"])
    return doc


def create_candidate(target_role, resume_text, skill_gaps=None, researched_requirements=None):
    """Create a candidate record."""
    db = get_db()
    doc = {
        "target_role": target_role,
        "resume_text": resume_text,
        "skill_gaps": skill_gaps or [],
        "researched_requirements": researched_requirements or [],
        "uploaded_at": datetime.now(timezone.utc),
    }
    result = db.candidates.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


def create_interview(candidate_id, target_role, evaluation_plan, transcript=None):
    """Create an interview record."""
    db = get_db()
    doc = {
        "candidate_id": ObjectId(candidate_id) if isinstance(candidate_id, str) else candidate_id,
        "target_role": target_role,
        "transcript": transcript or [],
        "status": "in_progress",
        "start_time": datetime.now(timezone.utc),
        "end_time": None,
        "evaluation_plan": evaluation_plan,
    }
    result = db.interviews.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


def update_interview(interview_id, update_fields):
    """Update an interview record."""
    db = get_db()
    oid = ObjectId(interview_id) if isinstance(interview_id, str) else interview_id
    db.interviews.update_one({"_id": oid}, {"$set": update_fields})


def append_to_transcript(interview_id, entry):
    """Append an entry to the interview transcript."""
    db = get_db()
    oid = ObjectId(interview_id) if isinstance(interview_id, str) else interview_id
    db.interviews.update_one({"_id": oid}, {"$push": {"transcript": entry}})


def save_evaluation(interview_id, evaluation):
    """Save evaluation results."""
    db = get_db()
    oid = ObjectId(interview_id) if isinstance(interview_id, str) else interview_id
    doc = {
        "interview_id": oid,
        "scores": evaluation.get("scores", {}),
        "strengths": evaluation.get("strengths", []),
        "areas_to_improve": evaluation.get("areas_to_improve", []),
        "overall_feedback": evaluation.get("overall_feedback", ""),
        "created_at": datetime.now(timezone.utc),
    }
    result = db.evaluations.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)


def get_interview(interview_id):
    """Get an interview by ID."""
    db = get_db()
    oid = ObjectId(interview_id) if isinstance(interview_id, str) else interview_id
    doc = db.interviews.find_one({"_id": oid})
    return serialize_doc(doc)


def get_evaluation(interview_id):
    """Get evaluation for an interview."""
    db = get_db()
    oid = ObjectId(interview_id) if isinstance(interview_id, str) else interview_id
    doc = db.evaluations.find_one({"interview_id": oid})
    return serialize_doc(doc)
