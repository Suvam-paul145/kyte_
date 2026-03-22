import httpx
import asyncio
import json
import jwt
import time
import os

# Configuration from config.py defaults
JWT_SECRET = "kyte-dev-secret"
JWT_ALGO = "HS256"

def generate_dev_token():
    payload = {
        "sub": "test-wallet-123",
        "role": ["developer"],
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600
    }
    encoded = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)
    # PyJWT 2.0+ returns str, older versions return bytes. Handle both.
    if isinstance(encoded, bytes):
        return encoded.decode('utf-8')
    return encoded

async def test_agent():
    # Make sure we use localhost which resolves to 127.0.0.1 on Windows often, 
    # but the server is listening on 0.0.0.0 so localhost should work.
    url = "http://127.0.0.1:8000/agent/run"
    
    try:
        token = generate_dev_token()
    except Exception as e:
        print(f"Failed to generate token: {e}")
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "github_url": "https://github.com/example/repo",
        "task": "Analyze security vulnerabilities"
    }
    
    print(f"Generated token: {token[:20]}...")
    print(f"Connecting to {url}...")
    
    try:
        async with httpx.AsyncClient(timeout=3000.0) as client:
            async with client.stream("POST", url, json=payload, headers=headers) as response:
                if response.status_code != 200:
                    print(f"Error: {response.status_code}")
                    # Read error content
                    try:
                        # For error responses, we can just read the body
                        content = ""
                        async for chunk in response.aiter_text():
                            content += chunk
                        print(content)
                    except Exception as e:
                        print(f"Failed to read error body: {e}")
                    return

                print("Connected! Streaming events:")
                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line:
                        continue
                        
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            print("\n[Stream finished]")
                            break
                        
                        try:
                            # Parse JSON
                            event = json.loads(data)
                            type_ = event.get("type", "unknown")
                            
                            if type_ == "message":
                                print(f"🤖 MSG: {event.get('content')}")
                            elif type_ == "tool_call":
                                tool_args = json.dumps(event.get('args'), indent=2)
                                print(f"🛠️ TOOL: {event.get('tool')}\n   Args: {tool_args}")
                            elif type_ == "tool_result":
                                result = json.dumps(event.get('result'), indent=2)
                                print(f"✅ RESULT: {event.get('tool')}\n   Output: {result}")
                            elif type_ == "error":
                                print(f"❌ ERROR: {event.get('content')}")
                            else:
                                print(f"EVENT: {data}")
                        except json.JSONDecodeError as e:
                            print(f"RAW: {data} (Parse Error: {e})")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_agent())
