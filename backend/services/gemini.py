import google.generativeai as genai
import os
import json
import re
from typing import List
from models.project import ProjectRequirement, EvaluationResult

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise Exception("GEMINI_API_KEY not set")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    async def evaluate(self, requirements: List[str], content: str) -> EvaluationResult:
        prompt = self._build_prompt(requirements, content)
        
        response = self.model.generate_content(prompt)
        text = response.text
        
        # Clean JSON response
        clean_json = re.sub(r"```json|```", "", text).strip()
        data = json.loads(clean_json)
        
        # Parse into Pydantic models
        results = [ProjectRequirement(**res) for res in data.get("results", [])]
        
        return EvaluationResult(
            results=results,
            overall_score=data.get("overall_score", 0),
            gap_report=data.get("gap_report", ""),
            payment_released=False # Set by router based on score
        )

    def _build_prompt(self, requirements: List[str], content: str) -> str:
        req_str = "\n".join([f"- {r}" for r in requirements])
        
        return f"""
        You are a strict technical auditor evaluating software submissions. 
        Your task is to audit the provided SUBMISSION CONTENT against the list of REQUIREMENTS.
        
        REQUIREMENTS:
        {req_str}
        
        SUBMISSION CONTENT:
        {content}
        
        Evaluate each requirement. For each one, determine if it has been met, provide a score from 0 to 100, and a concise reason.
        Then calculate an overall score (0-100) and provide a comprehensive gap report if requirements are not fully met.
        
        Respond ONLY with a JSON object in the following format:
        {{
            "results": [
                {{
                    "requirement": "exact requirement text",
                    "met": true/false,
                    "score": 0-100,
                    "reason": "specific explanation"
                }}
            ],
            "overall_score": 0-100,
            "gap_report": "comprehensive explanation of failures"
        }}
        """
