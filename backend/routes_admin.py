"""Admin API routes - manage users, interviews, stats."""
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from auth import get_current_user, require_admin, hash_password
from database.mongodb import get_db, serialize_doc

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def admin_stats(_: dict = Depends(require_admin)):
    db = get_db()
    total_users = db.users.count_documents({})
    total_interviews = db.interviews.count_documents({})
    completed = db.interviews.count_documents({"status": "completed"})
    in_progress = db.interviews.count_documents({"status": "in_progress"})
    total_evals = db.evaluations.count_documents({})

    # Average score across evaluations
    pipeline = [
        {"$project": {
            "avg": {"$avg": [
                "$scores.technical_knowledge",
                "$scores.problem_solving",
                "$scores.communication",
                "$scores.role_knowledge",
                "$scores.depth_of_understanding",
            ]}
        }},
        {"$group": {"_id": None, "avg": {"$avg": "$avg"}}},
    ]
    agg = list(db.evaluations.aggregate(pipeline))
    avg_score = round(agg[0]["avg"], 1) if agg else 0

    return {
        "total_users": total_users,
        "total_interviews": total_interviews,
        "completed_interviews": completed,
        "in_progress_interviews": in_progress,
        "total_evaluations": total_evals,
        "average_score": avg_score,
    }


@router.get("/users")
async def list_users(_: dict = Depends(require_admin)):
    db = get_db()
    users = []
    for doc in db.users.find().sort("created_at", -1):
        users.append({
            "id": str(doc["_id"]),
            "name": doc.get("name", ""),
            "email": doc.get("email", ""),
            "role": doc.get("role", "user"),
            "created_at": doc.get("created_at"),
        })
    return {"users": users}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    db = get_db()
    if user_id == admin["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    result = db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}


@router.put("/users/{user_id}/role")
async def change_role(user_id: str, payload: dict, admin: dict = Depends(require_admin)):
    db = get_db()
    new_role = payload.get("role")
    if new_role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
    result = db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": new_role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"Role changed to {new_role}"}


@router.get("/interviews")
async def list_interviews(_: dict = Depends(require_admin)):
    db = get_db()
    interviews = []
    for doc in db.interviews.find().sort("start_time", -1).limit(100):
        item = serialize_doc(doc)
        # Attach evaluation scores if exists
        ev = db.evaluations.find_one({"interview_id": doc["_id"]})
        if ev:
            s = ev.get("scores", {})
            vals = [v for v in s.values() if isinstance(v, (int, float))]
            item["avg_score"] = round(sum(vals) / len(vals), 1) if vals else None
        else:
            item["avg_score"] = None
        interviews.append(item)
    return {"interviews": interviews}


@router.delete("/interviews/{interview_id}")
async def delete_interview(interview_id: str, _: dict = Depends(require_admin)):
    db = get_db()
    oid = ObjectId(interview_id)
    db.interviews.delete_one({"_id": oid})
    db.evaluations.delete_one({"interview_id": oid})
    return {"message": "Interview deleted"}


@router.get("/evaluations")
async def list_evaluations(_: dict = Depends(require_admin)):
    db = get_db()
    evals = []
    for doc in db.evaluations.find().sort("created_at", -1).limit(100):
        evals.append(serialize_doc(doc))
    return {"evaluations": evals}
