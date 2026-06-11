"use client";

import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, X } from "lucide-react";

interface KillSwitchProps {
  hasOwnerCap?: boolean;
  onConfirmKill?: () => void;
  isExecuting?: boolean;
}

export default function KillSwitch({
  hasOwnerCap = true, // By default mock as true so the layout can be viewed
  onConfirmKill = () => alert("Emergency kill triggered!"),
  isExecuting = false,
}: KillSwitchProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="glass-card p-6 flex flex-col gap-5 text-sm h-full">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <ShieldAlert className="text-red-400" size={18} />
        <h2 className="text-base font-semibold text-background">
          Emergency Intervention
        </h2>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        If this agent goes rogue, experiences severe slippage, or is executing
        malicious calls, the Guardian context can override autonomy immediately.
      </p>

      {hasOwnerCap ? (
        <div className="flex flex-col gap-3">
          <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 text-xs text-red-300 flex items-start gap-2.5">
            <AlertTriangle className="shrink-0 text-red-400" size={16} />
            <div>
              <span className="font-semibold text-background block mb-0.5">
                Guardian Cap Detected
              </span>
              Your connected wallet holds the owner capability (`OwnerCap`)
              object required to pause this agent.
            </div>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="w-full py-3 px-4 rounded-xl font-bold bg-red-600 hover:bg-red-500 active:scale-[0.98] text-background tracking-wider uppercase text-xs transition-all shadow-[0_4px_20px_rgba(220,38,38,0.25)] flex items-center justify-center gap-2 cursor-pointer"
          >
            ⚡ TRIGGER EMERGENCY KILL
          </button>
        </div>
      ) : (
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-gray-400 flex items-start gap-2.5">
          <AlertTriangle className="shrink-0 text-gray-500" size={16} />
          <div>
            <span className="font-semibold text-background block mb-0.5">
              Emergency Controls Locked
            </span>
            Connect the wallet holding this agent's `OwnerCap` to activate the
            emergency hatch.
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 border-red-500/30 flex flex-col gap-6 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <AlertTriangle size={20} />
                <h2>CRITICAL EMERGENCY WARNING</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-background transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-gray-300 flex flex-col gap-3 leading-relaxed">
              <p>
                Triggering the emergency hatch is an **irreversible operation**
                for the active agent lifecycle:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1.5 text-gray-400">
                <li>
                  The agent's state machine will be permanently set to{" "}
                  <strong className="text-background">PAUSED</strong>.
                </li>
                <li>
                  All active off-chain monitoring, prediction, and routing
                  triggers will immediately abort.
                </li>
                <li>
                  <strong className="text-background">
                    All encapsulated SUI tokens
                  </strong>{" "}
                  inside the agent object will be drained and transferred to
                  your wallet address.
                </li>
              </ul>
              <p className="font-semibold text-red-300 bg-red-950/20 p-2.5 rounded border border-red-900/30">
                Warning: Any off-chain transactions currently in progress on
                DeepBook may fail due to atomic checks.
              </p>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 font-semibold text-xs text-background transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onConfirmKill();
                }}
                disabled={isExecuting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-background font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isExecuting ? "Executing..." : "Confirm & Paused"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
