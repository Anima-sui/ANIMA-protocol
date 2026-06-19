"use client";

import React, { useState } from "react";
import { Copy, Shield, Key, Sparkles } from "lucide-react";

interface IdentityPanelProps {
  ownerAddress?: string;
  ownerCapId?: string;
  backendCapId?: string;
  reputationScore?: number;
  createdEpoch?: number;
}

export default function IdentityPanel({
  ownerAddress = "0x8a924403079b76a084c8a213a70820246391a97b0457a7218e12a134f2c9f90f",
  ownerCapId = "0x2dbccc75d6f9d21987786ea3a70820246391a97b0457a7218e12a134f2c9f90",
  backendCapId = "0x4ca3ddbbcca88a4f7163003792c521f8d6a41a60ea7a1f360aebcec7006bdbf",
  reputationScore = 142,
  createdEpoch = 1125,
}: IdentityPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const truncate = (str: string) => `${str.slice(0, 10)}...${str.slice(-8)}`;

  // Max reputation capacity display helper
  const repPercentage = Math.min(100, (reputationScore / 200) * 100);

  return (
    <div className="glass-card p-6 flex flex-col gap-6 h-full text-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <Shield className="text-[#6fa0ff]" size={18} />
        <h2 className="text-base font-semibold text-background">
          Identity & Governance
        </h2>
      </div>

      {/* Reputation Score Progress Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-gray-400 flex items-center gap-1">
            <Sparkles size={14} className="text-[#6fa0ff]" /> Reputation Score
          </span>
          <span className="text-background">{reputationScore / 2} / 100</span>
        </div>
        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-[#0241ff] to-[#6fa0ff] rounded-full transition-all duration-500"
            style={{ width: `${repPercentage / 2}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Reputation score increments automatically on successful execution of
          authorized, off-chain computations.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Owner Address */}
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-medium text-gray-400">
            Guardian Owner
          </div>
          <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg border border-white/5 font-mono text-xs text-black">
            <span>{truncate(ownerAddress)}</span>
            <button
              onClick={() => handleCopy(ownerAddress, "owner")}
              className="hover:text-background transition-colors cursor-pointer"
            >
              <Copy
                size={13}
                className={copiedField === "owner" ? "text-emerald-400" : ""}
              />
            </button>
          </div>
        </div>

        {/* OwnerCap ID */}
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-medium text-gray-400 flex items-center gap-1">
            <Key size={12} /> Owner Capability Object
          </div>
          <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg border border-white/5 font-mono text-xs text-black">
            <span>{truncate(ownerCapId)}</span>
            <button
              onClick={() => handleCopy(ownerCapId, "ownerCap")}
              className="hover:text-background transition-colors cursor-pointer"
            >
              <Copy
                size={13}
                className={copiedField === "ownerCap" ? "text-emerald-400" : ""}
              />
            </button>
          </div>
        </div>

        {/* BackendCap ID */}
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-medium text-gray-400 flex items-center gap-1">
            <Key size={12} /> Backend Capability Object
          </div>
          <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg border border-white/5 font-mono text-xs text-black">
            <span>{truncate(backendCapId)}</span>
            <button
              onClick={() => handleCopy(backendCapId, "backendCap")}
              className="hover:text-background transition-colors cursor-pointer"
            >
              <Copy
                size={13}
                className={
                  copiedField === "backendCap" ? "text-emerald-400" : ""
                }
              />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-white/5 flex justify-between text-xs text-gray-500">
        <span>Genesis Epoch</span>
        <span className="font-mono text-gray-500">{createdEpoch}</span>
      </div>
    </div>
  );
}
