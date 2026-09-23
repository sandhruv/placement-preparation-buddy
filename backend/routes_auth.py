"""Auth API routes - register, login, me."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field

from auth import hash_password, verify_password, create_token, get_current_user, require_admin
from database.mongodb import get_db, serialize_doc

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
async def register(req: RegisterRequest):
    db = get_db()

    existing = db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # First registered user becomes admin
    user_count = db.users.count_documents({})
    role = "admin" if user_count == 0 else "user"

    user_doc = {
        "name": req.name.strip(),
        "email": req.email.lower(),
        "password": hash_password(req.password),
        "role": role,
        "created_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc),
    }
    result = db.users.insert_one(user_doc)

    token = create_token(str(result.inserted_id), role, req.email.lower())

    return {
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "name": user_doc["name"],
            "email": user_doc["email"],
            "role": role,
        },
        "message": f"Registered as {role}",
    }


@router.post("/login")
async def login(req: LoginRequest):
    db = get_db()
    user = db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(str(user["_id"]), user.get("role", "user"), user["email"])

    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "email": user["email"],
            "role": user.get("role", "user"),
        },
    }


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    db = get_db()
    from bson import ObjectId
    doc = db.users.find_one({"_id": ObjectId(user["user_id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "email": doc["email"],
        "role": doc.get("role", "user"),
    }
