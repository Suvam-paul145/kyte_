import httpx
import asyncio
import json

async def test_agent():
    url = "http://localhost:8000/agent/run"
    payload = {
        "github_url": "https://github.com/example/repo",
        "task": "Analyze security vulnerabilities"
    }
    
    print(f"Connecting to {url}...")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("POST", url, json=payload) as response:
                if response.status_code != 200:
                    print(f"Error: {response.status_code}")
                    print(await response.read())
                    return

                print("Connected! Streaming events:")
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            print("\n[Stream finished]")
                            break
                        try:
                            event = json.loads(data)
                            type_ = event.get("type", "unknown")
                            if type_ == "message":
                                print(f"🤖 MSG: {event.get('content')}")
                            elif type_ == "tool_call":
                                print(f"🛠️ TOOL: {event.get('tool')} ({event.get('args')})")
                            elif type_ == "tool_result":
                                print(f"✅ RESULT: {event.get('result')}")
                            else:
                                print(f"EVENT: {event}")
                        except json.JSONDecodeError:
                            print(f"RAW: {data}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_agent())
