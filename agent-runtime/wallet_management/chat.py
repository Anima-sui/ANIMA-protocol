import sys
import os
from typing import Dict, Any, List
from .intent_parser import IntentParser
from .wallet_agent import WalletAgent

class AnimaChat:
    """Interactive CLI chat interface to manage ANIMA Sui wallet assets."""

    def __init__(self, wallet_agent: WalletAgent, intent_parser: IntentParser):
        self.wallet = wallet_agent
        self.parser = intent_parser

    def run(self):
        """Main REPL loop."""
        self._print_banner()

        while True:
            try:
                # Prompt user for input
                user_input = input("\nyou > ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\n\n👋 ANIMA agent shutting down.")
                break

            if user_input.lower() in ("exit", "quit", "q"):
                print("👋 ANIMA agent shutting down.")
                break
            if user_input.lower() in ("help", "h", "?"):
                self._print_help()
                continue
            if not user_input:
                continue

            self._handle_message(user_input)

    def _print_banner(self):
        """Display startup status and identity parameters."""
        print("╔══════════════════════════════════════════════════════════╗")
        print("║  🤖 ANIMA Wallet Agent — Interactive Mode                ║")
        print("║  Talk to your agent in natural language.                  ║")
        print("║  Type 'exit' to quit or 'help' for examples.             ║")
        print("╚══════════════════════════════════════════════════════════╝")
        
        # Initial status fetch
        bal_info = self.wallet.check_balance()
        
        print(f"  Agent NFA ID: {self.wallet.agent_object_id}")
        print(f"  Operator:     {self.wallet.operator_address}")
        print(f"  Balance:      {bal_info['balance_sui']:.4f} SUI ({bal_info['source']})")

    def _print_help(self):
        """Print list of available wallet instructions and examples."""
        print("\n💡 ANIMA Wallet Agent Help:")
        print("  You can talk to the agent in natural language. Here are some examples:")
        print("\n  📊 Balance Queries:")
        print("    - 'what is my balance?'")
        print("    - 'how much SUI do I have?'")
        print("\n  💸 Transfers:")
        print("    - 'send 0.1 SUI to 0x1a2b...3f4a'")
        print("    - 'transfer 0.05 SUI to 0x7d8e...5b6c'")
        print("\n  📦 Complex Distribution Splits:")
        print("    - 'take 80% of my SUI, keep 30% of it, split the remaining across these three addresses: [address1], [address2], [address3]'")
        print("    - 'distribute 50% of my balance to 0x1a2b...3f4a and keep the rest'")
        print("\n  🚪 Commands:")
        print("    - 'help', 'h', '?' : Show this help message")
        print("    - 'exit', 'quit', 'q' : Exit the interactive chat")

    def _handle_message(self, message: str):
        """Parses the user prompt, displays plans, requests verification and executes transactions."""
        print("🤖 ANIMA > Parsing instruction...")
        
        # Fetch fresh balance from blockchain for calculation context
        balance_info = self.wallet.check_balance()
        balance_sui = balance_info["balance_sui"]

        # Parse natural language message to JSON plan
        plan = self.parser.parse(message)
        
        action = plan.get("action", "unknown")
        explanation = plan.get("explanation", "")
        
        if action == "unknown":
            print(f"\n🤖 ANIMA > I couldn't understand that or there was an issue:\n   {explanation}")
            return
            
        if action == "balance":
            print(f"\n🤖 ANIMA > Vault Balance: {balance_sui:.4f} SUI ({balance_info['balance_mist']:,} MIST)")
            print(f"   Source: {balance_info['source']}")
            return

        if action in ("transfer", "distribute"):
            recipients = plan.get("parameters", {}).get("recipients", [])
            
            if not recipients:
                # LLM parsed transfer/distribute but didn't extract any valid recipient
                print("\n🤖 ANIMA > No recipients found in your request. Please specify recipient addresses.")
                return
            
            # Perform distribution math
            working_sui, reserve_sui, split_pool_sui, per_recipient_sui = self.wallet.calculate_distribution_amounts(plan, balance_sui)
            
            # Print Action Plan details
            print("\n   📋 Proposed Action Plan:")
            print(f"   - Action: {action.upper()}")
            print(f"   - Explanation: {explanation}")
            print(f"   - Agent Balance: {balance_sui:.4f} SUI")
            
            # If percentages are customized
            params = plan.get("parameters", {})
            if "working_percent" in params or "reserve_percent" in params:
                working_pct = params.get("working_percent", 100.0)
                reserve_pct = params.get("reserve_percent", 0.0)
                print(f"   - Working Amount ({working_pct:.2f}% of balance): {working_sui:.4f} SUI")
                print(f"   - Vault Reserve ({reserve_pct:.2f}% of working): {reserve_sui:.4f} SUI (stays in vault)")
                print(f"   - Distributable Pool: {split_pool_sui:.4f} SUI")

            print(f"\n   The following transfers will be executed:")
            for idx, r in enumerate(recipients, 1):
                clean_addr = r.strip()
                is_valid = self.wallet.validate_address(clean_addr)
                valid_str = "" if is_valid else " ⚠️ (INVALID ADDRESS FORMAT)"
                print(f"   {idx}. {per_recipient_sui:.4f} SUI → {clean_addr}{valid_str}")

            # Prompt confirmation to ensure no unintended transactions are run
            confirm = input("\n   Execute? (yes/no): ").strip().lower()
            if confirm not in ("yes", "y"):
                print("❌ Aborted by user.")
                return

            # Execute sequentially
            print("\n🤖 ANIMA > Executing transfers...")
            for idx, r in enumerate(recipients, 1):
                clean_addr = r.strip()
                if not self.wallet.validate_address(clean_addr):
                    print(f"   ✖ Skipping transfer {idx}: '{clean_addr}' is not a valid Sui address.")
                    continue
                
                amount_mist = int(per_recipient_sui * 1_000_000_000)
                
                # Check for minimum Sui transfer constraints
                if amount_mist <= 0:
                    print(f"   ✖ Skipping transfer {idx}: calculated transfer amount is zero.")
                    continue

                print(f"   → Transferring {per_recipient_sui:.4f} SUI to {clean_addr[:10]}...")
                res = self.wallet.execute_transfer(clean_addr, amount_mist)
                
                if res["success"]:
                    print(f"   ✓ Transfer {idx} success | Digest: {res['tx_digest']}")
                    print(f"     Explorer link: https://suivision.xyz/txblock/{res['tx_digest']}")
                else:
                    print(f"   ✖ Transfer {idx} failed: {res['error']}")
            
            # Fetch remaining balance after operations completed
            new_bal = self.wallet.check_balance()
            print(f"\n✅ Finished processing action plan. Remaining Balance: {new_bal['balance_sui']:.4f} SUI")
            return

        print("\n🤖 ANIMA > Intent recognized but execution is not supported.")
