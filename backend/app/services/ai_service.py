from typing import Dict, Any, Optional
import json
import openai
from openai import AzureOpenAI
import os
from app.core.config import settings

class AIService:
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_KEY,
            api_version="2023-05-15",
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        )
        self.deployment_name = settings.AZURE_OPENAI_DEPLOYMENT
    
    def generate_cover_letter(
        self, 
        resume_content: str, 
        job_description: str, 
        user_name: str, 
        company_name: str
    ) -> str:
        """Generate a personalized cover letter based on resume and job description."""
        prompt = f"""
        Generate a professional cover letter for {user_name} applying to {company_name}.
        
        Resume:
        {resume_content}
        
        Job Description:
        {job_description}
        
        The cover letter should:
        1. Be professional and enthusiastic
        2. Highlight relevant skills from the resume that match the job description
        3. Show understanding of the company and position
        4. Include a strong opening and closing paragraph
        5. Be approximately 400 words
        """
        
        response = self.client.chat.completions.create(
            model=self.deployment_name,
            messages=[
                {"role": "system", "content": "You are a professional career advisor who writes compelling cover letters."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1200
        )
        
        return response.choices[0].message.content
    
    def calculate_job_match_score(self, resume_content: str, job_description: str) -> Dict[str, Any]:
        """Calculate how well a resume matches a job description."""
        prompt = f"""
        Analyze how well the candidate's resume matches the job description.
        
        Resume:
        {resume_content}
        
        Job Description:
        {job_description}
        
        Provide:
        1. A match score from 0-100
        2. Top 3 matching skills
        3. Top 3 missing skills
        4. Brief explanation (max 100 words)
        
        Format your response as a JSON object with keys: score, matching_skills, missing_skills, explanation.
        """
        
        response = self.client.chat.completions.create(
            model=self.deployment_name,
            messages=[
                {"role": "system", "content": "You are a job matching AI that analyzes resumes against job descriptions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=800,
            response_format={"type": "json_object"}
        )
        
        try:
            result = json.loads(response.choices[0].message.content)
            return result
        except Exception as e:
            return {
                "score": 0,
                "matching_skills": [],
                "missing_skills": [],
                "explanation": f"Error parsing AI response: {str(e)}"
            }
