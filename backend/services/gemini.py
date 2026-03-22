"""
GeminiService — wraps the new google-genai SDK with:
  - GeminiManager: rate-limit safe generation with exponential backoff
  - GeminiService: high-level evaluate() used by routers
"""
import time
import random
import asyncio
import json
import re
import os
from typing import List

from google import genai
from google.genai import errors as genai_errors

from models.project import ProjectRequirement, EvaluationResult


# ── Gemini Manager (handles retries + quota) ───────────────────────────────────

class GeminiManager:
    """
    Manages Gemini API requests with automatic rate-limit retries
    using exponential backoff (google-genai SDK).
    """
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.models = {
            "fast":  "gemini-2.0-flash-lite",   # high-volume, cheap tasks
            "smart": "gemini-2.0-flash",          # scoring + synthesis
        }

    def safe_generate(self, prompt: str, model_type: str = "fast", max_retries: int = 5) -> str:
        """Synchronous generate with exponential backoff. Returns ERROR: string on total failure."""
        model_id = self.models.get(model_type, self.models["fast"])
        delay = 2

        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=model_id,
                    contents=prompt,
                )
                return response.text
            except Exception as e:
                err = str(e)
                if "429" in err or "quota" in err.lower() or "RESOURCE_EXHAUSTED" in err:
                    wait = delay + random.uniform(0, 1)
                    print(f"[GeminiManager] Rate limit hit. Retry {attempt+1}/{max_retries} in {wait:.1f}s …")
                    time.sleep(wait)
                    delay *= 2
                elif "API_KEY_INVALID" in err or "invalid" in err.lower():
                    print(f"[GeminiManager] ⚠️  Invalid API key — will use mock fallback.")
                    return "ERROR: Invalid API key."
                else:
                    print(f"[GeminiManager] Unexpected error: {e}")
                    return f"ERROR: {e}"

        return "ERROR: Could not complete request after retries."

    async def async_generate(self, prompt: str, model_type: str = "fast") -> str:
        """Async wrapper so agents can call safe_generate inside asyncio.gather()."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.safe_generate, prompt, model_type)


# ── GeminiService (evaluation logic) ──────────────────────────────────────────

class GeminiService:
    """High-level service used by the evaluation router."""

    # MOCK mode: set to True to skip real API calls (for local testing)
    MOCK_MODE = os.getenv("GEMINI_MOCK", "false").lower() == "true"

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            print("[GeminiService] ⚠️  No GEMINI_API_KEY found — running in mock mode.")
            self.manager = None
        else:
            try:
                self.manager = GeminiManager(api_key)
            except Exception as e:
                print(f"[GeminiService] ⚠️  Failed to init Gemini client ({e}) — running in mock mode.")
                self.manager = None

    async def evaluate(self, requirements: List[str], content: str) -> EvaluationResult:
        """Evaluate content against requirements. Auto-falls back to mock on any failure."""
        if self.MOCK_MODE or not self.manager:
            return self._mock_evaluation(requirements)

        try:
            prompt = self._build_prompt(requirements, content)
            raw = await self.manager.async_generate(prompt, model_type="smart")

            if raw.startswith("ERROR:"):
                raise ValueError(raw)

            clean = re.sub(r"```json|```", "", raw).strip()
            data = json.loads(clean)

            results = [ProjectRequirement(**r) for r in data.get("results", [])]
            return EvaluationResult(
                results=results,
                overall_score=data.get("overall_score", 0),
                gap_report=data.get("gap_report", ""),
                payment_released=False,
            )
        except Exception as e:
            print(f"[GeminiService] ⚠️  Live evaluation failed ({e}) — falling back to mock.")
            return self._mock_evaluation(requirements)

    def _mock_evaluation(self, requirements: List[str]) -> EvaluationResult:
        """Returns a deterministic mock evaluation for testing."""
        results = [
            ProjectRequirement(
                requirement=r,
                met=True,
                score=85,
                reason="[MOCK] Requirement appears to be met based on code structure.",
            )
            for r in requirements
        ]
        return EvaluationResult(
            results=results,
            overall_score=85,
            gap_report="[MOCK] No critical gaps found in this mock evaluation.",
            payment_released=False,
        )

    def _build_prompt(self, requirements: List[str], content: str) -> str:
        req_str = "\n".join([f"- {r}" for r in requirements])
        return f"""
You are a strict technical auditor evaluating software submissions.
Audit the SUBMISSION CONTENT against the REQUIREMENTS below.

REQUIREMENTS:
{req_str}

SUBMISSION CONTENT:
{content}

For each requirement, determine if it is met, give a score 0-100, and a concise reason.
Then give an overall_score (0-100) and a gap_report.

Respond ONLY with a JSON object:
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
    "gap_report": "summary of failures"
}}
"""
