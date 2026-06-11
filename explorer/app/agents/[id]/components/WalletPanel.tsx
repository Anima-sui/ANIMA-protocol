"use client";

import React from "react";
import { Wallet, TrendingUp, RefreshCw } from "lucide-react";

interface WalletPanelProps {
  balanceSui?: number;
  totalVolumeSui?: number;
  lastUpdated?: string;
  isPolling?: boolean;
}

export default function WalletPanel({
  balanceSui = 450.75,
  totalVolumeSui = 1840.5,
  lastUpdated = "Just now",
  isPolling = true,
}: WalletPanelProps) {
  return (
    <div className="glass-card p-6 flex flex-col gap-6 h-full text-sm">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Wallet className="text-[#6fa0ff]" size={18} />
          <h2 className="text-base font-semibold text-background">
            Sovereign Wallet
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 ${isPolling ? "" : "hidden"}`}
            ></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Polled (10s)
        </div>
      </div>

      {/* Numerical SUI Balance block */}
      <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Current Balance
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-background tracking-tight">
            {balanceSui.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}
          </span>
          <span className="text-sm font-bold text-[#6fa0ff]">SUI</span>
        </div>
        <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
          <RefreshCw size={10} className="animate-spin-slow" />
          Last active sync: {lastUpdated}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Total Volume */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp size={11} className="text-emerald-400" /> Total Volume
          </span>
          <span className="text-base font-bold text-background font-mono">
            {totalVolumeSui.toLocaleString()} SUI
          </span>
        </div>

        {/* Network State */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Sui Network
          </span>
          <span className="text-base font-bold text-gray-300">Testnet</span>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed">
        The sovereign wallet balance is fully encapsulated inside the on-chain
        agent object. Funds can only be withdrawn during emergency kill actions.
      </p>
    </div>
  );
}
