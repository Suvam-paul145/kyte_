"""
MedTriageSLM — FastAPI Fallback Server
For environments where WebAssembly/WebGPU is unavailable.
Runs SmolLM2-360M on the server and exposes a REST endpoint.

Usage:
    pip install -r requirements.txt
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Endpoints:
    POST /triage   — Run triage classification
    GET  /health   — Server and model health check
    GET  /docs     — Auto-generated OpenAPI docs
"""

from __future__ import annotations

import json
import time
import logging
from functools import lru_cache
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="MedTriageSLM API",
    description="On-premise medical triage classification using fine-tuned SmolLM2-360M",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production!
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ─── Config ───────────────────────────────────────────────────────────────────

MODEL_ID = "YOUR_USERNAME/medtriage-smollm2-360m"
FALLBACK_MODEL_ID = "HuggingFaceTB/SmolLM2-360M-Instruct"

SYSTEM_PROMPT = (
    "You are a medical triage assistant deployed in an emergency department. "
    "Classify the patient's symptom description into exactly one urgency tier. "
    "Respond ONLY with a valid JSON object. No preamble, no markdown, no explanation outside the JSON. "
    "Required JSON schema: "
    '{"urgency": "EMERGENCY"|"URGENT"|"SEMI_URGENT"|"NON_URGENT", '
    '"confidence": <float>, "esi_level": <1-5>, "reasoning": "<string>", '
    '"recommended_action": "<string>", "red_flags": [<strings>], "do_not_send_home": <bool>}'
)

# ─── Models ───────────────────────────────────────────────────────────────────

class TriageRequest(BaseModel):
    symptom: str = Field(..., min_length=10, max_length=2000,
                         description="Free-text patient symptom description")
    patient_age: Optional[int] = Field(None, ge=0, le=120, description="Patient age (optional)")
    patient_sex: Optional[str] = Field(None, description="Patient biological sex (optional)")

    @validator("symptom")
    def symptom_must_be_meaningful(cls, v):
        if len(v.split()) < 3:
            raise ValueError("Symptom description must be at least 3 words")
        return v.strip()

    class Config:
        schema_extra = {
            "example": {
                "symptom": "65 year old male, sudden severe chest pain radiating to left arm, sweating, shortness of breath",
                "patient_age": 65,
                "patient_sex": "male"
            }
        }


class TriageResponse(BaseModel):
    urgency: str
    confidence: float
    esi_level: int
    reasoning: str
    recommended_action: str
    red_flags: list[str]
    do_not_send_home: bool
    inference_ms: Optional[float] = None
    model_id: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "urgency": "EMERGENCY",
                "confidence": 0.97,
                "esi_level": 1,
                "reasoning": "Classic acute MI presentation. Immediate intervention required.",
                "recommended_action": "Immediate resuscitation bay. Activate cardiac team.",
                "red_flags": ["haemodynamic_instability"],
                "do_not_send_home": True,
                "inference_ms": 312.4,
                "model_id": "medtriage-smollm2-360m"
            }
        }


# ─── Model loading ────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def get_pipeline():
    """Load model once and cache. Using lru_cache for lazy singleton."""
    try:
        from transformers import pipeline
        import torch

        logger.info(f"Loading model: {MODEL_ID}")
        device = 0 if __import__("torch").cuda.is_available() else -1

        pipe = pipeline(
            "text-generation",
            model=MODEL_ID,
            device=device,
            torch_dtype=__import__("torch").float16 if device == 0 else __import__("torch").float32,
            trust_remote_code=True
        )
        logger.info("Model loaded successfully")
        return pipe, MODEL_ID

    except Exception as e:
        logger.warning(f"Custom model failed ({e}), falling back to base model")
        from transformers import pipeline
        pipe = pipeline("text-generation", model=FALLBACK_MODEL_ID, device=-1)
        return pipe, FALLBACK_MODEL_ID


def extract_json(text: str) -> dict:
    """Extract and parse JSON from model output, handling markdown fences."""
    t = text.strip()
    for prefix in ["```json", "```"]:
        if t.startswith(prefix):
            t = t[len(prefix):]
    if t.endswith("```"):
        t = t[:-3]
    t = t.strip()

    try:
        return json.loads(t)
    except json.JSONDecodeError:
        start = t.find("{")
        end = t.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(t[start:end])
        raise ValueError(f"Cannot extract JSON from: {t[:200]}")


def validate_triage_output(obj: dict) -> TriageResponse:
    required = ["urgency", "confidence", "esi_level", "reasoning",
                "recommended_action", "red_flags", "do_not_send_home"]
    missing = [k for k in required if k not in obj]
    if missing:
        raise ValueError(f"Missing required fields: {missing}")
    return TriageResponse(**obj)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/triage", response_model=TriageResponse, summary="Classify patient triage urgency")
async def triage(request: TriageRequest):
    """
    Run medical triage classification on patient symptoms.

    Returns a structured JSON assessment with urgency level, ESI score,
    clinical reasoning, recommended action, and safety flags.

    **This endpoint processes sensitive medical information.
    Deploy only within your secure internal network or with appropriate access controls.**
    """
    pipe, model_id = get_pipeline()

    symptom_text = request.symptom
    if request.patient_age:
        symptom_text = f"[Age: {request.patient_age}] " + symptom_text
    if request.patient_sex:
        symptom_text = f"[Sex: {request.patient_sex}] " + symptom_text

    prompt = f"[INST] {SYSTEM_PROMPT}\n\nPatient symptoms: {symptom_text} [/INST]"

    start_time = time.perf_counter()
    try:
        output = pipe(
            prompt,
            max_new_tokens=300,
            temperature=0.1,
            do_sample=False,
            pad_token_id=pipe.tokenizer.eos_token_id,
            return_full_text=False
        )
        inference_ms = (time.perf_counter() - start_time) * 1000
        generated_text = output[0]["generated_text"]

        parsed = extract_json(generated_text)
        result = validate_triage_output(parsed)
        result.inference_ms = round(inference_ms, 1)
        result.model_id = model_id.split("/")[-1]
        return result

    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=f"Triage inference failed: {str(e)}")


@app.get("/health", summary="Health check")
async def health():
    """Returns model load status and server health."""
    try:
        pipe, model_id = get_pipeline()
        return {
            "status": "healthy",
            "model": model_id.split("/")[-1],
            "model_loaded": True
        }
    except Exception as e:
        return {
            "status": "degraded",
            "model_loaded": False,
            "error": str(e)
        }


@app.get("/", summary="API root")
async def root():
    return {
        "name": "MedTriageSLM API",
        "version": "1.0.0",
        "docs": "/docs",
        "triage_endpoint": "POST /triage",
        "note": "Patient data processed locally. Not for production clinical use without validation."
    }
