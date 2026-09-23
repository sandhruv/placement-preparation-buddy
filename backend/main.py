"""Placement Prep Buddy Backend - Main Entry Point"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

_jwt = os.getenv("JWT_SECRET")
if _jwt:
    os.environ["JWT_SECRET"] = _jwt

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from routes import router as interview_router
from routes_auth import router as auth_router
from routes_admin import router as admin_router

app = FastAPI(title="Placement Prep Buddy API", version="2.0.0")

_extra_origins = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "").split(",")
    if o.strip()
]
allow_origins = list(
    dict.fromkeys(
        [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            *_extra_origins,
        ]
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(interview_router, prefix="/api")


@app.get("/api")
async def api_root():
    return {"message": "Placement Prep Buddy API is running"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/health")
async def health_root():
    return {"status": "ok"}


# Serve built frontend (Render single-service deploy)
_frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if _frontend_dist.is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=str(_frontend_dist / "assets")),
        name="assets",
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str):
        candidate = _frontend_dist / full_path
        if full_path and candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(_frontend_dist / "index.html"))
