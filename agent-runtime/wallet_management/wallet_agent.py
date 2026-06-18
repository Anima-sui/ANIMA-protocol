import os
import sys
import json
import subprocess
import logging
from typing import Dict, Any, List, Optional

# Add the parent directory to the path so we can import from src
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.sui_client import SuiRPCClient

logger = logging.getLogger(__name__)

class WalletAgent:
    """Executes on-chain wallet queries and programmable transaction blocks (PTBs)."""

    def __init__(self, operator_address: str, agent_object_id: str, package_id: str):
        self.operator_address = operator_address
        self.agent_object_id = agent_object_id
        self.package_id = package_id
        self.rpc_client = SuiRPCClient()

    def check_balance(self) -> dict:
        """
        Queries the agent vault balance from the on-chain ANIMA object.
        Falls back to operator gas balance if object is unavailable or not minted.
        
        Returns:
            dict: { "balance_mist": int, "balance_sui": float, "source": str }
        """
        # If the object is not yet minted, query the operator's balance instead
        if not self.agent_object_id or self.agent_object_id == "awaiting_minting":
            return self._get_operator_balance("awaiting_minting")

        try:
            # Attempt to fetch directly from Sui RPC
            obj = self.rpc_client.fetch_object(self.agent_object_id)
            if obj:
                fields = self.rpc_client.get_object_fields(obj)
                
                # Check for "wallet_balance" (from contracts) or "balance" (from sui_client/mock)
                balance_field = fields.get("wallet_balance") or fields.get("balance")
                
                if balance_field and isinstance(balance_field, dict):
                    # Sui balance/coin structures usually wrap values in a inner "value" field
                    value_str = balance_field.get("fields", {}).get("value") or balance_field.get("value")
                    if value_str is not None:
                        balance_mist = int(value_str)
                        return {
                            "balance_mist": balance_mist,
                            "balance_sui": balance_mist / 1_000_000_000,
                            "source": "nfa_vault"
                        }
                
                # Fallback check if it was returned as a direct string or int
                if balance_field is not None:
                    try:
                        balance_mist = int(balance_field)
                        return {
                            "balance_mist": balance_mist,
                            "balance_sui": balance_mist / 1_000_000_000,
                            "source": "nfa_vault"
                        }
                    except (ValueError, TypeError):
                        pass

        except Exception as e:
            logger.error(f"Error querying agent object balance: {e}")

        # Fallback to operator balance check
        return self._get_operator_balance("operator_fallback")

    def _get_operator_balance(self, source: str) -> dict:
        """Helper to check the operator's local Sui balance as a fallback."""
        cmd_bal = ["sui", "client", "balance", self.operator_address, "--json"]
        is_windows = sys.platform.startswith('win')
        try:
            res_bal = subprocess.run(cmd_bal, capture_output=True, text=True, shell=is_windows)
            if res_bal.returncode == 0:
                bal_data = json.loads(res_bal.stdout)
                
                # Recursive function to parse Sui balance fields
                def find_sui_balances(data) -> list[int]:
                    balances = []
                    if isinstance(data, dict):
                        coin_type = data.get("coinType", "")
                        if "sui::SUI" in coin_type or coin_type.endswith("::SUI"):
                            for k in ("totalBalance", "balance"):
                                if k in data:
                                    try:
                                        balances.append(int(data[k]))
                                    except (ValueError, TypeError):
                                        pass
                        for v in data.values():
                            balances.extend(find_sui_balances(v))
                    elif isinstance(data, list):
                        for item in data:
                            balances.extend(find_sui_balances(item))
                    return balances
                
                sui_balances = find_sui_balances(bal_data)
                if sui_balances:
                    balance_mist = max(sui_balances)
                    return {
                        "balance_mist": balance_mist,
                        "balance_sui": balance_mist / 1_000_000_000,
                        "source": source
                    }
        except Exception as e:
            logger.error(f"Failed to fetch operator fallback balance: {e}")
            
        # Hard default if everything fails
        return {
            "balance_mist": 0,
            "balance_sui": 0.0,
            "source": "failed_lookup"
        }

    def validate_address(self, address: str) -> bool:
        """Verify if string matches standard 32-byte hexadecimal Sui address."""
        if not address:
            return False
        addr = address.strip()
        if addr.startswith("@"):
            addr = addr[1:]
        if addr.startswith("0x"):
            addr = addr[2:]
        return len(addr) == 64 and all(c in "0123456789abcdefABCDEF" for c in addr)

    def execute_transfer(self, recipient: str, amount_mist: int) -> dict:
        """
        Executes a vault fund extraction and transfer to a recipient address.
        
        Returns:
            dict: { "success": bool, "tx_digest": str, "error": str }
        """
        # Ensure target address is formatted correctly for command
        target_recipient = recipient.strip()
        if not target_recipient.startswith("@") and not target_recipient.startswith("0x"):
            target_recipient = f"@{target_recipient}"
        elif target_recipient.startswith("0x") and not target_recipient.startswith("@"):
            target_recipient = f"@{target_recipient}"

        # Clean agent object ID
        agent_id = self.agent_object_id
        if agent_id == "awaiting_minting":
            # Test default to allow test execution without actual minting
            agent_id = "0xd4177df14064788426efb4e5e4661f98a06bc01b29df1447261454b2dd5ef0d4"
        
        agent_arg = agent_id if agent_id.startswith("@") else f"@{agent_id}"

        cmd = [
            "sui", "client", "ptb",
            "--sender", f"@{self.operator_address}",
            "--move-call", f"{self.package_id}::wallet::extract_funds_for_action", agent_arg, str(amount_mist),
            "--assign", "extracted_coin",
            "--transfer-objects", "[extracted_coin]", target_recipient,
            "--json"
        ]

        is_windows = sys.platform.startswith('win')
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, shell=is_windows)
            
            if result.returncode == 0:
                tx_data = {}
                try:
                    tx_data = json.loads(result.stdout)
                except Exception:
                    pass
                
                digest = None
                if isinstance(tx_data, dict):
                    digest = tx_data.get("digest")
                elif isinstance(tx_data, list) and len(tx_data) > 0:
                    digest = tx_data[0].get("digest")
                
                return {
                    "success": True,
                    "tx_digest": digest or "Submitted (no digest in json)",
                    "error": ""
                }
            else:
                return {
                    "success": False,
                    "tx_digest": "",
                    "error": f"Exit code {result.returncode}. Stdout: {result.stdout.strip()} | Stderr: {result.stderr.strip()}"
                }
        except Exception as e:
            return {
                "success": False,
                "tx_digest": "",
                "error": str(e)
            }

    def calculate_distribution_amounts(self, plan: dict, balance_sui: float) -> tuple[float, float, float, float]:
        """
        Calculates working amount, reserve amount, split pool, and per-wallet amount.
        
        Returns:
            tuple: (working_sui, reserve_sui, split_pool_sui, per_recipient_sui)
        """
        params = plan.get("parameters", {})
        working_pct = params.get("working_percent", 100.0)
        reserve_pct = params.get("reserve_percent", 0.0)
        split_count = params.get("split_count", 1)

        working_sui = balance_sui * (working_pct / 100.0)
        reserve_sui = working_sui * (reserve_pct / 100.0)
        split_pool_sui = working_sui - reserve_sui
        
        if split_count > 0:
            per_recipient_sui = split_pool_sui / split_count
        else:
            per_recipient_sui = split_pool_sui

        return working_sui, reserve_sui, split_pool_sui, per_recipient_sui
