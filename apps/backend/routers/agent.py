from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import logging

from dependencies import require_dev
from services.agent_core import agent

router = APIRouter()
logger = logging.getLogger(__name__)

class AgentRunRequest(BaseModel):
    github_url: str
    task: str = "Analyze this repository and fix any issues found."

@router.post("/run")
async def run_agent(request: AgentRunRequest, payload: dict = Depends(require_dev)):
    """
    Starts the AgentCore loop and streams events back to the client.
    """
    logger.info(f"Starting agent run for {request.github_url}")
    
    # Construct the user prompt
    user_input = f"Here is the GitHub URL: {request.github_url}\nTask: {request.task}"
    
    async def event_generator():
        try:
            async for event_json in agent.run_loop(user_input):
                yield f"data: {event_json}\n\n"
        except Exception as e:
            logger.error(f"Agent loop error: {e}")
            error_msg = json.dumps({"type": "error", "content": str(e)})
            yield f"data: {error_msg}\n\n"
        
        # End of stream
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
