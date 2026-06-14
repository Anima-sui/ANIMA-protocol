"use client";

import React, { useState } from "react";
import { Wallet, TrendingUp, RefreshCw, X, Coins } from "lucide-react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "../../../../lib/constants";

interface WalletPanelProps {
  agentObjectId: string;
  balanceSui?: number;
  totalVolumeSui?: number;
  lastUpdated?: string;
  isPolling?: boolean;
}

export default function WalletPanel({
  agentObjectId,
  balanceSui = 0.0,
  totalVolumeSui = 0.0,
  lastUpdated = "Just now",
  isPolling = true,
}: WalletPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid deposit amount.");
      return;
    }

    setIsDepositing(true);

    try {
      const tx = new Transaction();
      
      // Calculate MIST (1 SUI = 1,000,000,000 MIST)
      const amountInMist = BigInt(Math.floor(amount * 1_000_000_000));
      
      // Split the amount from gas coin
      const [splitCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);
      
      // Call wallet::deposit_funds
      tx.moveCall({
        target: `${PACKAGE_ID}::wallet::deposit_funds`,
        arguments: [
          tx.object(agentObjectId),
          splitCoin,
        ],
      });

      const response = await signAndExecuteTransaction({ transaction: tx });
      await suiClient.waitForTransaction({ digest: response.digest });
      
      alert(`Successfully deposited ${amount} SUI into the agent vault!`);
      setIsModalOpen(false);
      setDepositAmount("");
      window.location.reload();
    } catch (err: any) {
      console.error("Deposit failed:", err);
      alert(err.message || "Failed to complete deposit transaction.");
    } finally {
      setIsDepositing(false);
    }
  };

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

        {currentAccount && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 py-2.5 px-4 rounded-xl font-bold bg-[#0241ff] hover:bg-[#0241ff]/90 active:scale-[0.98] text-white text-xs transition-all flex items-center justify-center gap-2 cursor-pointer w-full shadow-md"
          >
            <Coins size={14} />
            Fund Agent Wallet
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Total Volume */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp size={11} className="text-emerald-400" /> Total Volume
          </span>
          <span className="text-base font-bold text-background font-mono">
            {totalVolumeSui.toLocaleString(undefined, { maximumFractionDigits: 4 })} SUI
          </span>
        </div>

        {/* Network State */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Sui Network
          </span>
          <span className="text-base font-bold text-black">Testnet</span>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed">
        The sovereign wallet balance is fully encapsulated inside the on-chain
        agent object. Funds can only be withdrawn during emergency kill actions.
      </p>

      {/* Fund Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 border-blue-500/30 flex flex-col gap-6 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#6fa0ff] font-bold">
                <Coins size={20} />
                <h2>Fund Sovereign Agent Wallet</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-background transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDeposit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">
                  Amount to Deposit (SUI)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 5.5"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand text-background pr-[60px]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-xs text-[#6fa0ff]">
                    SUI
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                  This transaction will extract SUI from your connected wallet and deposit it directly into the agent's internal vault balance.
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 font-semibold text-xs text-background transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDepositing}
                  className="flex-1 py-2.5 rounded-lg bg-[#0241ff] hover:bg-[#0241ff]/90 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isDepositing ? "Depositing..." : "Confirm Deposit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
