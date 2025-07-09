from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    resumes = relationship("Resume", back_populates="user")
    cover_letters = relationship("CoverLetter", back_populates="user")
    job_applications = relationship("JobApplication", back_populates="user")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String)
    file_path = Column(String)
    content = Column(Text)
    parsed_data = Column(Text)  # JSON string of parsed resume data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="resumes")

class CoverLetter(Base):
    __tablename__ = "cover_letters"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String)
    content = Column(Text)
    job_description = Column(Text)
    resume_id = Column(String, ForeignKey("resumes.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="cover_letters")
    job_applications = relationship("JobApplication", back_populates="cover_letter")

class JobApplication(Base):
    __tablename__ = "job_applications"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    job_title = Column(String)
    company = Column(String)
    job_description = Column(Text)
    job_url = Column(String)
    status = Column(String)  # Applied, Interview, Offer, Rejected, etc.
    resume_id = Column(String, ForeignKey("resumes.id"), nullable=True)
    cover_letter_id = Column(String, ForeignKey("cover_letters.id"), nullable=True)
    match_score = Column(Float, nullable=True)
    applied_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="job_applications")
    cover_letter = relationship("CoverLetter", back_populates="job_applications")
