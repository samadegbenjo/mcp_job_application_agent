from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
import os

from app.database import get_db, engine, Base
from app.models import models
from app.api import users, resumes, cover_letters, jobs, auth
from app.core.config import settings
from app.core.security import create_access_token

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MCP Job Application Agent API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, tags=["Authentication"], prefix="/api/auth")
app.include_router(users.router, tags=["Users"], prefix="/api/users")
app.include_router(resumes.router, tags=["Resumes"], prefix="/api/resumes")
app.include_router(cover_letters.router, tags=["Cover Letters"], prefix="/api/cover-letters")
app.include_router(jobs.router, tags=["Jobs"], prefix="/api/jobs")

@app.get("/")
def root():
    return {"message": "MCP Job Application Agent API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
