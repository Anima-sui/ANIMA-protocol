import os
import time
import base64
import requests
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Get NVIDIA API KEY
nvidia_api_key = os.getenv("NVIDIA_API_KEY")

if not nvidia_api_key:
    print("Error: NVIDIA_API_KEY not found in environment or .env file.")
    exit(1)

# Ensure Authorization header is formatted correctly
# The key in .env might already start with "Bearer "
if nvidia_api_key.startswith("Bearer "):
    auth_header = nvidia_api_key
else:
    auth_header = f"Bearer {nvidia_api_key}"

# Mask key for safe printing
masked_key = auth_header[:15] + "..." + auth_header[-8:]
print(f"Loaded API Key: {masked_key}")

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
stream = False

headers = {
  "Authorization": auth_header,
  "Accept": "text/event-stream" if stream else "application/json",
  "Content-Type": "application/json"
}

# Prompt designed to test intent parsing for wallet actions
system_prompt = """You are ANIMA, an autonomous wallet manager agent on the Sui blockchain.
Your task is to parse the user's natural language request into a structured JSON action plan.

Respond ONLY with a valid JSON object. Do not include markdown blocks, backticks, or any other conversational text.

JSON Schema:
{
  "action": "transfer" | "distribute" | "balance" | "unknown",
  "parameters": {
    "recipients": [string] (list of recipient address strings),
    "working_percent": float (percentage of balance to use, default 100),
    "reserve_percent": float (percentage of working balance to keep, default 0),
    "split_count": int (number of wallets to split remaining across)
  },
  "explanation": "Brief explanation of what the agent will do"
}
"""

user_prompt = "Calculate 80% of my Sui balance, keep 30% of that in reserve, and share the rest to three wallets: 0x9f5b2c9d1e3a4b7f8c0e2d4a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c, 0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b, and 0x7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e"

payload = {
  "model": "moonshotai/kimi-k2.6",
  "messages": [
      {"role": "system", "content": system_prompt},
      {"role": "user", "content": user_prompt}
  ],
  "max_tokens": 1024,
  "temperature": 0.0,  # lower temp for structured response
  "top_p": 1.0,
  "stream": stream,
}

print(f"Sending request to Kimi K2.6 ({invoke_url})...")
start_time = time.time()

try:
    response = requests.post(invoke_url, headers=headers, json=payload, timeout=60)
    end_time = time.time()
    elapsed = end_time - start_time
    
    print(f"Response received in {elapsed:.2f} seconds.")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print("\n--- Response JSON ---")
        try:
            res_json = response.json()
            print(res_json)
            # Print content specifically
            if "choices" in res_json and len(res_json["choices"]) > 0:
                print("\n--- Model Text Output ---")
                print(res_json["choices"][0]["message"]["content"])
        except Exception as e:
            print(f"Failed to parse JSON response: {e}")
            print(response.text)
    else:
        print("Error response text:")
        print(response.text)
        
except Exception as e:
    print(f"Request failed: {e}")
