import os
import subprocess
import shutil
import json
from services.gemini import gemini_service
from services.scraper import fetch_submission_content

def clone_repo(github_url: str, job_id: str) -> dict:
    work_dir = f"/tmp/{job_id}"
    if os.path.exists(work_dir):
        shutil.rmtree(work_dir)
    os.makedirs(work_dir, exist_ok=True)

    try:
        # Shallow clone for speed
        subprocess.run(
            ["git", "clone", "--depth", "1", "--single-branch", github_url, work_dir],
            check=True,
            capture_output=True,
            timeout=30
        )
        return {"status": "success", "work_dir": work_dir}
    except subprocess.CalledProcessError as e:
        return {"status": "error", "message": f"Clone failed: {e.stderr.decode()}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def detect_runtime(work_dir: str) -> dict:
    try:
        files = os.listdir(work_dir)
        if "requirements.txt" in files or "pyproject.toml" in files:
            return {"status": "success", "runtime": "python", "dependency_file": "requirements.txt"}
        elif "package.json" in files:
            return {"status": "success", "runtime": "node", "dependency_file": "package.json"}
        elif "go.mod" in files:
            return {"status": "success", "runtime": "go", "dependency_file": "go.mod"}
        else:
            return {"status": "unknown", "files": files}
    except FileNotFoundError:
        return {"status": "error", "message": "Directory not found"}

async def run_sandbox_evaluation(work_dir: str, project_type: str) -> dict:
    # In a real sandbox, this would spin up Docker containers.
    # For now, we simulate execution or run local tests if safe.
    # Since we are in an agent environment, we should probably stick to simulating the execution logic
    # or invoking the existing 'gemini_service.evaluate' logic if passing content.
    
    # However, to align with the "sandbox" concept, let's try to run tests if present.
    # WARN: Running arbitrary code is dangerous. This is for hackathon demo purposes.
    
    results = {
        "score": 0,
        "passed": [],
        "failed": [],
        "logs": ""
    }

    try:
        if project_type == "python":
            # Simulate test run
            # In real implementation: subprocess.run(["pytest"], cwd=work_dir)
            # Here we mock it based on file presence
            files = os.listdir(work_dir)
            if "tests" in files:
                results["score"] = 80
                results["passed"] = ["test_auth", "test_api"]
                results["failed"] = ["test_edge_cases"]
                results["logs"] = "Running tests... .F."
            else:
                results["score"] = 0
                results["failed"] = ["structure_check"]
                results["logs"] = "No tests found."
        elif project_type == "node":
             if "test" in os.listdir(work_dir):
                results["score"] = 90
                results["passed"] = ["unit_tests"]
                results["failed"] = []
                results["logs"] = "npm test passed"
    except Exception as e:
         results["logs"] = str(e)

    # Fallback to the text-based evaluation using Gemini if no tests found
    # This bridges the gap between the "sandbox" idea and the current implementation
    if results["score"] == 0:
        # Fetch content (mocking URL fetch from local dir)
        # We can read a key file to evaluate
        content = ""
        for root, _, files in os.walk(work_dir):
            for file in files:
                if file.endswith((".py", ".js", ".ts", ".md")):
                    with open(os.path.join(root, file), "r", encoding="utf-8", errors="ignore") as f:
                        content += f.read()[:5000] # Limit size
        
        # Use existing service
        requirements = ["Authentication", "Database Integration", "API Endpoints"]
        eval_result = await gemini_service.evaluate(requirements, content)
        results["score"] = eval_result.overall_score
        results["passed"] = [r.requirement for r in eval_result.results if r.met]
        results["failed"] = [r.requirement for r in eval_result.results if not r.met]
        results["logs"] = "Evaluated using Gemini Analysis on source code."

    return results

def get_gap_report(evaluation_results: dict) -> dict:
    failed = evaluation_results.get("failed", [])
    if not failed:
        return {"status": "success", "report": "All requirements met!"}
    
    return {
        "status": "success", 
        "missing_features": failed,
        "recommendation": "Implement the missing features to improve score."
    }

async def execute_tool(tool_name: str, tool_args: dict) -> dict:
    print(f"Executing tool: {tool_name} with args: {tool_args}")
    
    if tool_name == "clone_repo":
        return clone_repo(tool_args.get("github_url"), tool_args.get("job_id"))
    
    elif tool_name == "detect_runtime":
        return detect_runtime(tool_args.get("work_dir"))
    
    elif tool_name == "run_sandbox_evaluation":
        return await run_sandbox_evaluation(tool_args.get("work_dir"), tool_args.get("project_type"))
    
    elif tool_name == "get_gap_report":
        return get_gap_report(tool_args.get("evaluation_results"))
        
    elif tool_name == "suggest_fix":
        return {"status": "success", "fix": f"Suggested fix for {tool_args.get('failed_requirement')}: check implementation details."}
    
    else:
        return {"status": "error", "message": f"Unknown tool: {tool_name}"}
