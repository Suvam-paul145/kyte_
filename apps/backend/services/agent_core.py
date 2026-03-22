import os
import asyncio
import json
from typing import AsyncGenerator

# Try to import google-generativeai, but handle if not installed yet
try:
    import google.generativeai as genai
    from google.generativeai.types import FunctionDeclaration, Tool as GenAITool
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

from services.agent_tools import tools_schema
from services.agent_prompts import SYSTEM_INSTRUCTION
from services.tool_executor import execute_tool

# Configure Gemini API
API_KEY = os.getenv("GEMINI_API_KEY")
MOCK_MODE = os.getenv("GEMINI_MOCK_MODE", "true").lower() == "true"

if HAS_GENAI and API_KEY and not MOCK_MODE:
    genai.configure(api_key=API_KEY)

class MockChatSession:
    def __init__(self):
        self.step = 0
        
    async def send_message_async(self, message):
        self.step += 1
        # Simple scripted flow for demonstration
        if self.step == 1:
            # First response: Decide to clone the repo
            return type('obj', (object,), {
                "parts": [
                    type('part', (object,), {
                        "text": "I will start by cloning the repository to inspect it.",
                        "function_call": type('fn', (object,), {
                            "name": "clone_repo",
                            "args": {"github_url": "https://github.com/example/repo", "job_id": "test-job-123"}
                        })()
                    })()
                ]
            })()
        elif self.step == 2:
            # Second: Detect runtime
            return type('obj', (object,), {
                "parts": [
                    type('part', (object,), {
                        "text": "Now I need to detect the project runtime.",
                        "function_call": type('fn', (object,), {
                            "name": "detect_runtime",
                            "args": {"work_dir": "/tmp/test-job-123"}
                        })()
                    })()
                ]
            })()
        elif self.step == 3:
             # Third: Run evaluation
             return type('obj', (object,), {
                "parts": [
                    type('part', (object,), {
                        "text": "Detected Python project. Running sandbox evaluation.",
                        "function_call": type('fn', (object,), {
                            "name": "run_sandbox_evaluation",
                            "args": {"work_dir": "/tmp/test-job-123", "project_type": "python"}
                        })()
                    })()
                ]
            })()
        else:
             # Final: Summary
             return type('obj', (object,), {
                "parts": [
                    type('part', (object,), {
                        "text": "The project scored 80/100. It passed basic tests but failed edge cases. I recommend adding more comprehensive tests.",
                        "function_call": None
                    })()
                ]
            })()

class MockGenerativeModel:
    def start_chat(self, enable_automatic_function_calling=False):
        return MockChatSession()

class AgentCore:
    def __init__(self):
        # Fallback to gemini-1.5-flash if 2.0 is not available
        self.model_name = "gemini-1.5-flash" 
        self.tools = tools_schema
        
        if MOCK_MODE or not API_KEY or not HAS_GENAI:
            print("Using Mock Agent Model")
            self.model = MockGenerativeModel()
        else:
            self.model = genai.GenerativeModel(
                model_name=self.model_name,
                tools=self._convert_tools_to_genai_format(),
                system_instruction=SYSTEM_INSTRUCTION
            )

    def _convert_tools_to_genai_format(self):
        # The library often accepts the raw function definitions if passed as a list of tools.
        # However, since we defined a JSON schema, we might need to adapt it.
        # For this hackathon implementation, we'll rely on the schema structure 
        # matching what the model expects or just pass the schema if using the REST API directly.
        # But with the SDK, we typically pass the actual python functions or a Tool object.
        # Let's try to map our schema to FunctionDeclaration objects.
        
        funcs = []
        for tool in self.tools:
            # We are manually declaring, so we use FunctionDeclaration
            # But the SDK is tricky with schemas. 
            # Ideally we'd pass the actual python functions to 'tools='.
            # Let's stub the functions for the SDK to introspect, OR use the raw schema if supported.
            # Given the constraints, let's create simple callables that match the schema for the SDK.
            pass 
        
        # ACTUALLY: The google.generativeai SDK allows passing a list of tool dictionaries 
        # if using the lower-level methods, OR function definitions.
        # Let's use a cleaner approach: Define the tools as a list of declarations.
        
        return [
            GenAITool(
                 function_declarations=[
                     FunctionDeclaration(
                         name=t["name"],
                         description=t["description"],
                         parameters=t["parameters"]
                     ) for t in self.tools
                 ]
            )
        ]

    async def run_loop(self, user_input: str) -> AsyncGenerator[str, None]:
        if not self.model:
            yield json.dumps({"type": "error", "content": "Gemini API not configured or library missing."})
            return

        chat = self.model.start_chat(enable_automatic_function_calling=False)
        
        try:
            # Initial message
            response = await chat.send_message_async(user_input)
        except Exception as e:
            yield json.dumps({"type": "error", "content": f"Gemini API initialization error: {str(e)}"})
            return
        
        # Loop for tool calls
        while True:
            try:
                # 1. Yield any text response first
                full_text = ""
                for part in response.parts:
                    if text := part.text:
                         full_text += text
                
                if full_text:
                     yield json.dumps({
                        "type": "message",
                        "content": full_text
                    })

                # 2. Check for function calls
                function_calls = []
                for part in response.parts:
                    if fn := part.function_call:
                        function_calls.append(fn)

                if not function_calls:
                    # No function calls, we are done
                    break
                
                # 3. Process function calls
                # For this simple loop, we handle one sequential function call chain
                # But Gemini 2.0 might return parallel calls. We handle the first one or loop.
                # Here we process sequentially for simplicity in the agent loop.
                
                for fn in function_calls:
                    tool_name = fn.name
                    tool_args = dict(fn.args)
                    
                    # Stream the tool call event
                    yield json.dumps({
                        "type": "tool_call",
                        "tool": tool_name,
                        "args": tool_args
                    })
                    
                    # Execute tool
                    try:
                        tool_result = await execute_tool(tool_name, tool_args)
                    except Exception as e:
                        tool_result = {"error": str(e)}

                    # Stream the tool result
                    yield json.dumps({
                        "type": "tool_result",
                        "tool": tool_name,
                        "result": tool_result
                    })
                    
                    # Send result back to Gemini
                    # Using the dictionary format for the response part
                    response_part = {
                        "function_response": {
                            "name": tool_name,
                            "response": tool_result
                        }
                    }
                    
                    response = await chat.send_message_async(response_part)
            
            except Exception as e:
                 yield json.dumps({"type": "error", "content": f"Agent loop error: {str(e)}"})
                 break

agent = AgentCore()
