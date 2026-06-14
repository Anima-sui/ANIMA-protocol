"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Grainient from "@/app/components/animations/Grainient";
import { supabase } from "@/lib/supabase";
import {
  Cpu,
  ExternalLink,
  Activity,
  Copy,
  Check,
  Clock,
  ArrowRight,
} from "lucide-react";

interface ActionItem {
  actionType: string;
  amount: string;
  timestamp: number;
  txDigest: string;
}

interface AgentItem {
  objectId: string;
  name: string;
  status: "ACTIVE" | "PAUSED";
  reputation: number;
  lastAction: ActionItem;
}

export default function AgentsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchAgents() {
      try {
        const { data: dbAgents, error: dbError } = await supabase
          .from("agents")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (dbError) throw dbError;

        if (dbAgents && isMounted) {
          const formattedAgents: AgentItem[] = [];
          for (const agent of dbAgents) {
            // Fetch the most recent action for this agent
            const { data: actionsData } = await supabase
              .from("agent_actions")
              .select("*")
              .eq("agent_object_id", agent.object_id)
              .order("timestamp", { ascending: false })
              .limit(1);

            const lastAction = actionsData && actionsData.length > 0 ? {
              actionType: actionsData[0].action_type,
              amount: actionsData[0].amount ? actionsData[0].amount.toString() : "0",
              timestamp: new Date(actionsData[0].timestamp).getTime(),
              txDigest: actionsData[0].tx_digest,
            } : {
              actionType: "MINT",
              amount: "0",
              timestamp: new Date(agent.created_at).getTime(),
              txDigest: "unknown",
            };

            formattedAgents.push({
              objectId: agent.object_id,
              name: agent.name,
              status: agent.is_paused ? "PAUSED" : "ACTIVE",
              reputation: agent.reputation_score,
              lastAction: lastAction,
            });
          }
          setAgents(formattedAgents);
        }
      } catch (err) {
        console.error("Error loading agents:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleCopy = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getBadgeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "SWAP":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "TRANSFER":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "COMPUTE":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "MINT":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "KILL_SWITCH":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const formatAmount = (mistStr: string) => {
    const mist = parseFloat(mistStr);
    if (isNaN(mist) || mist === 0) return "-";
    const sui = mist / 1_000_000_000;
    return `${sui.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SUI`;
  };

  const formatTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-accent text-white overflow-hidden">
      {/* Background anim */}
      <div className="absolute inset-0 z-0">
        <Grainient
          color1="#0241ff"
          color2="#000000"
          color3="#6fa0ff"
          timeSpeed={0.15}
          colorBalance={-0.2}
          warpStrength={0.8}
          warpFrequency={4}
          warpSpeed={1.5}
          warpAmplitude={40}
          blendAngle={45}
          blendSoftness={0.7}
          rotationAmount={300}
          noiseScale={2}
          grainAmount={0.08}
          grainScale={1.5}
          grainAnimated={false}
          contrast={2.2}
          gamma={1}
          saturation={0.9}
          centerX={0}
          centerY={0}
          zoom={0.85}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 w-[calc(100%-1rem)] bg-foreground rounded-tl-3xl rounded-tr-3xl max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-4 border-b border-white/10">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-black flex items-center gap-2">
                <Activity className="text-[#6fa0ff]" /> Active Network Agents
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Showing active AI agents (NFAs) on the Sui protocol ledger.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs flex items-center gap-2 w-fit">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold text-gray-500">
                Live Agent Feeds Syncing
              </span>
            </div>
          </div>

          {/* Table Listing */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-xs font-semibold uppercase tracking-wider bg-white/[0.02]">
                    <th className="py-4 px-6 w-[60%]">Agent Address / Name</th>
                    <th className="py-4 px-6 w-[40%]">
                      Most Recent Activity Log
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-gray-400">
                        Loading agents...
                      </td>
                    </tr>
                  ) : agents.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-gray-400">
                        No active agents found. Mint an agent to get started.
                      </td>
                    </tr>
                  ) : (
                    agents.map((agent) => (
                      <tr
                        key={agent.objectId}
                        className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group"
                      >
                        {/* Agent Address */}
                        <td className="py-4 px-6 font-mono">
                          <div className="flex items-center gap-2">
                            <Cpu size={14} className="text-[#6fa0ff] shrink-0" />
                            <div className="flex flex-col">
                              <Link
                                href={`/agents/${agent.objectId}`}
                                className="font-bold text-black hover:text-[#6fa0ff] hover:underline transition-colors cursor-pointer"
                              >
                                {agent.objectId}
                              </Link>
                              <span className="text-[10px] text-gray-500 font-sans font-semibold mt-0.5">
                                Name: {agent.name} | Rep: {agent.reputation} | Status:{" "}
                                <span className={agent.status === "ACTIVE" ? "text-emerald-400" : "text-red-400"}>
                                  {agent.status}
                                </span>
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleCopy(e, agent.objectId)}
                              className="p-1 hover:text-black transition-colors cursor-pointer text-gray-500 hover:bg-white/5 rounded"
                              title="Copy Address"
                            >
                              {copiedId === agent.objectId ? (
                                <Check size={12} className="text-emerald-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Most Recent Log (badge, amount, time, tx) */}
                        <td className="py-4 px-6">
                          <div className="flex items-center flex-wrap gap-2 text-xs text-gray-300">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider shrink-0 ${getBadgeColor(
                                agent.lastAction.actionType,
                              )}`}
                            >
                              {agent.lastAction.actionType}
                            </span>
                            {agent.lastAction.actionType !== "MINT" &&
                              agent.lastAction.actionType !== "KILL_SWITCH" && (
                                <span className="font-mono font-medium text-black">
                                  {formatAmount(agent.lastAction.amount)}
                                </span>
                              )}
                            <span className="text-gray-500 flex items-center gap-1">
                              <Clock size={11} />
                              {formatTime(agent.lastAction.timestamp)}
                            </span>
                            {agent.lastAction.txDigest !== "unknown" && (
                              <>
                                <span className="text-gray-500">|</span>
                                <a
                                  href={`https://suiexplorer.com/txblock/${agent.lastAction.txDigest}?network=testnet`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-mono text-[#6fa0ff] hover:text-black hover:underline cursor-pointer"
                                >
                                  Tx: {agent.lastAction.txDigest.slice(0, 6)}...
                                  {agent.lastAction.txDigest.slice(-6)}
                                  <ExternalLink size={11} className="opacity-50" />
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
