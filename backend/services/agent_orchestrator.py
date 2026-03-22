"""
AgentOrchestrator — 3-layer multi-agent evaluation system using asyncio.

Architecture:
  L1  Orchestrator      run_parallel_evaluation()
      ├── L2a  SandboxAgent       → AI evaluation of submission
      ├── L2b  CodeAnalyserAgent  → README / code structure summary
      └── L2c  ChainMonitorAgent  → Algorand on-chain state
            └── L3  FixAgents     → per-failed-requirement fix suggestions (parallel)

All agents are async functions with their own Gemini prompt + system role.
asyncio.gather() runs them in parallel — real wall-clock speedup.
"""
import asyncio
import os
from typing import List, Dict, Any

from services.gemini import GeminiManager
from services.scraper import ScraperService

# ── Shared manager instance ────────────────────────────────────────────────────
_api_key = os.getenv("GEMINI_API_KEY", "")
_manager = GeminiManager(_api_key) if _api_key else None
_scraper = ScraperService()

MOCK_MODE = os.getenv("AGENT_MOCK", "false").lower() == "true"


# ═════════════════════════════════════════════════════════════════════════════
# L2 Agents
# ═════════════════════════════════════════════════════════════════════════════

async def sandbox_agent(requirements: List[str], content: str) -> Dict[str, Any]:
    """
    L2a — Sandbox Agent
    Evaluates submission content against requirements.
    This is the MANDATORY agent every evaluation runs through.
    """
    print("[SandboxAgent] 🚀 Starting evaluation …")

    if MOCK_MODE or not _manager:
        await asyncio.sleep(0.3)  # simulate work
        results = [{"requirement": r, "met": True, "score": 82, "reason": "[MOCK] Looks good."} for r in requirements]
        return {
            "agent": "SandboxAgent",
            "status": "completed (mock)",
            "results": results,
            "overall_score": 82,
            "gap_report": "[MOCK] No critical gaps detected by sandbox agent.",
        }

    import json, re
    try:
        req_str = "\n".join(f"- {r}" for r in requirements)
        prompt = f"""You are a strict sandbox code evaluator.

REQUIREMENTS:
{req_str}

SUBMISSION CONTENT:
{content}

Evaluate each requirement strictly. Return JSON only:
{{
  "results": [{{"requirement":"...","met":true,"score":0-100,"reason":"..."}}],
  "overall_score": 0-100,
  "gap_report": "..."
}}"""

        raw = await _manager.async_generate(prompt, model_type="smart")
        if raw.startswith("ERROR:"):
            raise ValueError(raw)
        clean = re.sub(r"```json|```", "", raw).strip()
        data  = json.loads(clean)
        data["agent"]  = "SandboxAgent"
        data["status"] = "completed"
        return data
    except Exception as e:
        print(f"[SandboxAgent] ⚠️  Live call failed ({e}) — falling back to mock.")
        results = [{"requirement": r, "met": True, "score": 75, "reason": "[MOCK-FALLBACK] API unavailable."} for r in requirements]
        return {
            "agent": "SandboxAgent",
            "status": "completed (mock-fallback)",
            "results": results,
            "overall_score": 75,
            "gap_report": "[MOCK-FALLBACK] Evaluation fell back to mock due to API error.",
        }


async def code_analyser_agent(github_url: str) -> Dict[str, Any]:
    """
    L2b — Code Analyser Agent
    Fetches and summarises the README / repo structure.
    Runs in PARALLEL with the sandbox agent.
    """
    print("[CodeAnalyserAgent] 📂 Fetching repository content …")

    if MOCK_MODE:
        await asyncio.sleep(0.2)
        return {
            "agent": "CodeAnalyserAgent",
            "status": "completed (mock)",
            "summary": "[MOCK] Repository contains a well-structured FastAPI backend with Algorand integration. "
                       "Code quality appears high. Tests directory found. README is comprehensive.",
            "tech_stack": ["Python", "FastAPI", "Algorand", "Docker"],
        }

    try:
        content = await _scraper.fetch_content(github_url)
        if not _manager:
            return {"agent": "CodeAnalyserAgent", "status": "skipped", "summary": "No Gemini key available."}

        prompt = f"""You are a senior code reviewer. Analyse this repository content:

{content[:3000]}

Summarise: tech stack, code quality signals, test coverage signals, and any red flags.
Be concise — 3-5 sentences. Return plain text, not JSON."""

        summary = await _manager.async_generate(prompt, model_type="fast")
        if summary.startswith("ERROR:"):
            raise ValueError(summary)
        return {
            "agent": "CodeAnalyserAgent",
            "status": "completed",
            "summary": summary.strip(),
            "content_length": len(content),
        }
    except Exception as e:
        print(f"[CodeAnalyserAgent] ⚠️  Failed ({e}) — falling back to mock.")
        return {
            "agent": "CodeAnalyserAgent",
            "status": "completed (mock-fallback)",
            "summary": "[MOCK-FALLBACK] Could not analyse repository — API or network error.",
            "tech_stack": [],
        }


async def chain_monitor_agent(app_id: int) -> Dict[str, Any]:
    """
    L2c — Chain Monitor Agent
    Reads Algorand on-chain state for the contract.
    Runs in PARALLEL with sandbox and code analyser agents.
    """
    print(f"[ChainMonitorAgent] ⛓  Checking Algorand app_id={app_id} …")

    if MOCK_MODE:
        await asyncio.sleep(0.1)
        return {
            "agent": "ChainMonitorAgent",
            "status": "completed",
            "app_id": app_id,
            "chain_state": {
                "score": 0,
                "payment_released": False,
                "status": "OPEN",
                "last_updated": "N/A",
            },
        }

    try:
        import sys, os as _os
        sys.path.append(_os.path.abspath(_os.path.join(_os.path.dirname(__file__), "../..")))
        from blockchain.interact import KyteContract
        algo_token = _os.getenv("ALGORAND_TOKEN", "")
        algo_url   = _os.getenv("ALGORAND_NODE_URL", "https://testnet-api.algonode.cloud")
        contract   = KyteContract(algo_token, algo_url)
        state      = contract.get_state(app_id)
        return {"agent": "ChainMonitorAgent", "status": "completed", "app_id": app_id, "chain_state": state}
    except Exception as e:
        return {"agent": "ChainMonitorAgent", "status": "mocked_fallback", "app_id": app_id,
                "chain_state": {"score": 0, "payment_released": False, "status": "OPEN"},
                "note": f"Blockchain unavailable: {str(e)[:80]}"}


# ═════════════════════════════════════════════════════════════════════════════
# L3 Fix Agents (spawned in parallel per failed requirement)
# ═════════════════════════════════════════════════════════════════════════════

async def fix_agent(requirement: str, error_context: str) -> Dict[str, Any]:
    """
    L3 — Fix Agent
    One spawned per failed requirement. All run in parallel.
    """
    print(f"[FixAgent] 🔧 Generating fix for: {requirement[:60]} …")

    if MOCK_MODE or not _manager:
        await asyncio.sleep(0.15)
        return {
            "agent": "FixAgent",
            "requirement": requirement,
            "fix_suggestion": f"[MOCK FIX] To meet '{requirement}': implement the missing feature "
                              f"and add a corresponding test. Check the gap report for specifics.",
        }

    prompt = f"""You are a senior engineer giving fix recommendations.

FAILED REQUIREMENT: {requirement}
ERROR CONTEXT: {error_context}

Provide a concise, actionable fix suggestion (3-5 sentences). Plain text."""

    fix = await _manager.async_generate(prompt, model_type="fast")
    return {
        "agent": "FixAgent",
        "requirement": requirement,
        "fix_suggestion": fix.strip(),
    }


# ═════════════════════════════════════════════════════════════════════════════
# L1 Orchestrator
# ═════════════════════════════════════════════════════════════════════════════

async def run_parallel_evaluation(
    project_id: str,
    github_url: str,
    requirements: List[str],
    app_id: int = 0,
) -> Dict[str, Any]:
    """
    L1 Orchestrator — runs all agents and synthesises results.

    Phase 1 (parallel): SandboxAgent + CodeAnalyserAgent + ChainMonitorAgent
    Phase 2 (parallel): FixAgent per failed requirement (if any)
    """
    import time
    start = time.perf_counter()

    print("[Orchestrator] 🎬 Phase 1: spawning 3 parallel agents …")

    sandbox_result, code_result, chain_result = await asyncio.gather(
        sandbox_agent(requirements, f"GitHub submission: {github_url}"),
        code_analyser_agent(github_url),
        chain_monitor_agent(app_id),
    )

    # Phase 2: spawn fix agents for every failed requirement
    failed = [
        r for r in sandbox_result.get("results", [])
        if not r.get("met", True)
    ]
    fix_results = []
    if failed:
        print(f"[Orchestrator] 🔧 Phase 2: spawning {len(failed)} fix agent(s) in parallel …")
        gap_report = sandbox_result.get("gap_report", "")
        fix_tasks = [fix_agent(r["requirement"], gap_report) for r in failed]
        fix_results = await asyncio.gather(*fix_tasks)

    elapsed = time.perf_counter() - start

    return {
        "project_id": project_id,
        "github_url": github_url,
        "elapsed_seconds": round(elapsed, 2),
        "agents": {
            "sandbox":      sandbox_result,
            "code_analyser": code_result,
            "chain_monitor": chain_result,
        },
        "fix_suggestions":   list(fix_results),
        "overall_score":     sandbox_result.get("overall_score", 0),
        "payment_threshold": 80,
        "payment_eligible":  sandbox_result.get("overall_score", 0) >= 80,
    }
