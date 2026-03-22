tools_schema = [
    {
        "name": "clone_repo",
        "description": "Clones a GitHub repository into an isolated sandbox environment for analysis and testing.",
        "parameters": {
            "type": "object",
            "properties": {
                "github_url": {
                    "type": "string",
                    "description": "The full HTTPS URL of the public GitHub repository to clone."
                },
                "job_id": {
                    "type": "string",
                    "description": "Unique identifier for this job to create an isolated directory."
                }
            },
            "required": ["github_url", "job_id"]
        }
    },
    {
        "name": "detect_runtime",
        "description": "Scans the cloned repository to identify the programming language, framework, and required runtime environment.",
        "parameters": {
            "type": "object",
            "properties": {
                "work_dir": {
                    "type": "string",
                    "description": "The absolute path to the local directory where the repository was cloned."
                }
            },
            "required": ["work_dir"]
        }
    },
    {
        "name": "run_sandbox_evaluation",
        "description": "Executes the text suite in a Docker container or local environment and returns pass/fail results for each requirement.",
        "parameters": {
            "type": "object",
            "properties": {
                "work_dir": {
                    "type": "string",
                    "description": "The directory containing the source code."
                },
                "project_type": {
                    "type": "string",
                    "description": "The detected project type (e.g., 'python', 'node', 'go')."
                }
            },
            "required": ["work_dir", "project_type"]
        }
    },
    {
        "name": "get_gap_report",
        "description": "Analyzes the test results generate a detailed report of missing features or failed requirements.",
        "parameters": {
            "type": "object",
            "properties": {
                "evaluation_results": {
                    "type": "object",
                    "description": "The raw JSON output from the run_sandbox_evaluation tool."
                }
            },
            "required": ["evaluation_results"]
        }
    },
    {
        "name": "suggest_fix",
        "description": "Generates a specific code fix or implementation guide for a failed requirement.",
        "parameters": {
            "type": "object",
            "properties": {
                "failed_requirement": {
                    "type": "string",
                    "description": "The specific requirement that failed."
                },
                "context": {
                    "type": "string",
                    "description": "Relevant code snippets or error logs."
                }
            },
            "required": ["failed_requirement"]
        }
    }
]
