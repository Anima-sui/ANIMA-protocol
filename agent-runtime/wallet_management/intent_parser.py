import os
import json
import requests
from dotenv import load_dotenv

# Load environment variables just in case
load_dotenv()

class IntentParser:
    """Parses natural language requests into structured wallet action plans using the NVIDIA API."""

    def __init__(self):
        self.api_key = os.getenv("NVIDIA_API_KEY")
        self.invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
        self.model = "moonshotai/kimi-k2.6"
        
        if not self.api_key:
            # We don't crash on init, but we'll report it during parse
            pass

    def parse(self, message: str) -> dict:
        """
        Send the user's message to the LLM and get back the structured JSON action plan.
        
        Returns:
            dict matching the JSON schema
        """
        if not self.api_key:
            return {
                "action": "unknown",
                "parameters": {},
                "explanation": "NVIDIA_API_KEY is not configured in the environment."
            }

        # Form the authorization header properly
        auth_header = self.api_key if self.api_key.startswith("Bearer ") else f"Bearer {self.api_key}"

        headers = {
            "Authorization": auth_header,
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

        system_prompt = """You are ANIMA, an autonomous wallet manager agent on the Sui blockchain.
Your task is to parse the user's natural language request into a structured JSON action plan.

Respond ONLY with a valid JSON object matching the schema below. Do not include markdown blocks, backticks, or any other conversational text.

Schema Description:
- "action": string. Must be one of: "transfer", "distribute", "balance", or "unknown".
  - Use "balance" for queries checking or asking about current balance or funds.
  - Use "transfer" for sending SUI to a single recipient.
  - Use "distribute" for splitting SUI balance across one or more recipient wallets.
  - Use "unknown" if the request is not related to wallet tasks or is not understood.
- "parameters": object containing:
  - "recipients": list of strings (Sui address strings, empty if none).
  - "working_percent": number (percentage of balance to use, default 100).
  - "reserve_percent": number (percentage of working balance to keep, default 0).
  - "split_count": integer (number of wallets to split remaining across, default 1).
- "explanation": string containing a brief explanation of what the agent will do.

Example output for a balance check:
{
  "action": "balance",
  "parameters": {
    "recipients": [],
    "working_percent": 100.0,
    "reserve_percent": 0.0,
    "split_count": 1
  },
  "explanation": "Query the wallet balance"
}
"""

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            "max_tokens": 1024,
            "temperature": 0.0,
            "top_p": 1.0,
            "stream": False
        }

        try:
            response = requests.post(self.invoke_url, headers=headers, json=payload, timeout=30)
            if response.status_code != 200:
                return {
                    "action": "unknown",
                    "parameters": {},
                    "explanation": f"NVIDIA API returned error status {response.status_code}: {response.text}"
                }
            
            res_json = response.json()
            if "choices" not in res_json or len(res_json["choices"]) == 0:
                return {
                    "action": "unknown",
                    "parameters": {},
                    "explanation": "NVIDIA API response does not contain choices."
                }
            
            content = res_json["choices"][0]["message"]["content"].strip()
            
            # Clean up the output if the model included backticks or markdown JSON blocks
            if content.startswith("```"):
                lines = content.splitlines()
                # Remove starting ```json or ```
                if lines[0].startswith("```"):
                    lines = lines[1:]
                # Remove ending ```
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                content = "\n".join(lines).strip()
            
            # Parse the clean JSON content
            parsed_plan = json.loads(content)
            
            # Ensure required keys exist
            if "action" not in parsed_plan:
                parsed_plan["action"] = "unknown"
            if "parameters" not in parsed_plan:
                parsed_plan["parameters"] = {}
            if "explanation" not in parsed_plan:
                parsed_plan["explanation"] = "Intent parsed successfully."
                
            return parsed_plan

        except json.JSONDecodeError as e:
            return {
                "action": "unknown",
                "parameters": {},
                "explanation": f"Failed to parse model's response as JSON. Output was: {content}"
            }
        except Exception as e:
            return {
                "action": "unknown",
                "parameters": {},
                "explanation": f"Error communicating with NVIDIA API: {str(e)}"
            }
