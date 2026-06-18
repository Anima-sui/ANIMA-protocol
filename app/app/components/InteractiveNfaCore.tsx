"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  BookOpen,
  Clock,
  ToggleLeft,
  TrendingUp,
  ChevronRight,
  Zap,
  Shield,
  Activity,
  Lock,
  X,
} from "lucide-react";

/* ── Dynamic Three.js Import (no SSR) ── */
const NfaThreeScene = dynamic(() => import("./NfaThreeScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#0241ff]/30 border-t-[#0241ff] rounded-full animate-spin" />
    </div>
  ),
});

/* ─── NFA SUBSYSTEM DATA ─── */
interface NfaSubsystem {
  id: string;
  label: string;
  tagline: string;
  icon: React.ReactNode;
  description: string;
  example: string;
  codeSnippet: string;
  details: string[];
}

const subsystems: NfaSubsystem[] = [
  {
    id: "wallet",
    label: "Sovereign Wallet",
    tagline: "Independent Capital Layer",
    icon: <Wallet className="w-5 h-5" />,
    description:
      "Each NFA encapsulates its own Balance<SUI> vault — completely independent from the human owner's wallet. The agent can receive, hold, and deploy capital autonomously within programmatic boundaries.",
    example:
      "An NFA running a DeFi rebalancing strategy holds 50 SUI in its sovereign vault. It autonomously swaps 20 SUI into USDC via DeepBook without requiring the human to sign any transaction.",
    codeSnippet: `struct NFA has key {
  id: UID,
  balance: Balance<SUI>,  // Sovereign vault
  owner_cap: address,     // Human guardian
}`,
    details: [
      "Isolated from human wallet balance",
      "Programmatic deposit & withdrawal limits",
      "Emergency extraction via OwnerCap",
      "Supports multi-asset whitelisting",
    ],
  },
  {
    id: "skills",
    label: "Skill Registry",
    tagline: "Dynamic Authorization Layer",
    icon: <BookOpen className="w-5 h-5" />,
    description:
      "Dynamic fields on the NFA object define exactly what the agent is authorized to do. Each skill maps to a Walrus Blob ID containing the agent's operational code, risk parameters, and execution constraints.",
    example:
      "A market-making NFA has two registered skills: 'deepbook_liquidity_v2' and 'price_oracle_sync'. Each skill's logic is stored as a Walrus blob, cryptographically pinned to the NFA's on-chain identity.",
    codeSnippet: `// Dynamic field: skill registry
dynamic_field::add(
  &mut nfa.id,
  SkillKey { name: b"deepbook_lp" },
  SkillRecord {
    walrus_blob_id: blob_id,
    version: 1,
    is_active: true,
  }
);`,
    details: [
      "Stored as Sui dynamic fields",
      "Each skill → Walrus Blob ID",
      "Hot-swappable without redeployment",
      "Publicly auditable by any observer",
    ],
  },
  {
    id: "history",
    label: "Action History",
    tagline: "Immutable Accountability Layer",
    icon: <Clock className="w-5 h-5" />,
    description:
      "Every on-chain action the NFA executes is logged as a Sui event against its identity. This creates an immutable, queryable audit trail that cannot be tampered with — the foundation for trust and reputation.",
    example:
      "After executing a swap, the NFA emits an ActionExecuted event containing the NFA ID, action type, amount, timestamp, and result hash. Any protocol can query this history before granting the NFA access.",
    codeSnippet: `event::emit(ActionExecuted {
  nfa_id: object::id(&nfa),
  action_type: b"swap",
  amount: 20_000_000_000,
  timestamp: clock::timestamp_ms(clock),
  success: true,
});`,
    details: [
      "Emitted as native Sui events",
      "Queryable via Full Node RPC",
      "Tamper-proof by blockchain consensus",
      "Foundation for reputation scoring",
    ],
  },
  {
    id: "mode",
    label: "Operational Mode",
    tagline: "Emergency Control Layer",
    icon: <ToggleLeft className="w-5 h-5" />,
    description:
      "The NFA has two operational states: Normal (agent is live and executing) and Paused (emergency kill switch activated). Only the human holding the OwnerCap can toggle this state — creating an asymmetric human-to-machine safety boundary.",
    example:
      "At 3 AM, the agent's risk model detects an anomalous market condition. The human guardian receives an alert and flips the NFA to Paused mode. All pending executions halt immediately. Funds remain safe inside the sovereign vault.",
    codeSnippet: `public fun pause_agent(
  nfa: &mut NFA,
  cap: &OwnerCap,
  ctx: &TxContext,
) {
  assert!(cap.nfa_id == object::id(nfa));
  nfa.is_paused = true;
  // All execution halts
}`,
    details: [
      "Binary state: Normal | Paused",
      "Only OwnerCap holder can toggle",
      "Instant execution halt on pause",
      "No admin override — trustless design",
    ],
  },
  {
    id: "reputation",
    label: "Reputation Score",
    tagline: "Trust & Performance Layer",
    icon: <TrendingUp className="w-5 h-5" />,
    description:
      "A computed score derived from the NFA's action history. Updated after every execution, it reflects the agent's reliability, success rate, and operational consistency — enabling trust-based access control by DeFi protocols.",
    example:
      "A lending protocol checks an NFA's reputation score before allowing it to manage a liquidity pool. Agents with scores above 85/100 get priority access and reduced collateral requirements.",
    codeSnippet: `struct ReputationData has store {
  total_actions: u64,
  successful_actions: u64,
  total_volume: u64,
  score: u64,  // 0-100 computed
  last_updated: u64,
}`,
    details: [
      "Derived from on-chain action history",
      "Auto-updated on every execution",
      "Enables trust-gated protocol access",
      "Publicly verifiable by any observer",
    ],
  },
];

/* ─── MAIN COMPONENT ─── */
export default function InteractiveNfaCore() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeSubsystem = subsystems.find((s) => s.id === activeId) || null;

  // Auto-rotate through subsystems
  useEffect(() => {
    if (!autoRotate) return;

    let index = 0;
    intervalRef.current = setInterval(() => {
      setActiveId(subsystems[index % subsystems.length].id);
      index++;
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRotate]);

  const handleNodeSelect = (id: string) => {
    setAutoRotate(false);
    setActiveId(id === activeId ? null : id);
  };

  return (
    <section className="w-full relative z-10 overflow-hidden" style={{ background: "#080810" }}>
      {/* Subtle top-fade from previous section */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-20"
        style={{
          background:
            "linear-gradient(to bottom, #f8f8f8 0%, transparent 100%)",
        }}
      />

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-40 pb-24 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-[700px] mx-auto mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="w-12 h-px bg-[#0241ff]/50" />
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4d8aff] uppercase tracking-wider">
              Interactive Architecture
            </span>
            <div className="w-12 h-px bg-[#0241ff]/50" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight leading-tight mb-4 text-white">
            Anatomy of a Non-Fungible Agent
          </h2>
          <p className="text-zinc-400 text-sm md:text-base font-light leading-relaxed">
            Explore each subsystem that makes an NFA a sovereign, accountable,
            autonomous on-chain entity. Click any node to inspect its
            architecture.
          </p>
        </motion.div>

        {/* Interactive Core */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Three.js Canvas — Left */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div
              className="relative w-full rounded-2xl overflow-hidden border border-white/[0.06]"
              style={{
                aspectRatio: "1 / 1",
                background:
                  "radial-gradient(ellipse at center, rgba(2,65,255,0.06) 0%, transparent 70%)",
              }}
            >
              <NfaThreeScene
                activeNodeId={activeId}
                onNodeSelect={handleNodeSelect}
              />
            </div>
            {/* Interaction hint */}
            <p className="text-center text-zinc-600 text-[11px] mt-3 tracking-wide">
              Click any orbital node to explore · Drag to inspect
            </p>
          </motion.div>

          {/* Info Panel — Right */}
          <div className="lg:col-span-7 flex flex-col gap-4 min-h-[520px]">
            {/* Subsystem Navigation Pills */}
            <div className="flex flex-wrap gap-2">
              {subsystems.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleNodeSelect(sub.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    activeId === sub.id
                      ? "bg-[#0241ff] text-white shadow-lg shadow-[#0241ff]/25"
                      : "bg-white/[0.05] text-zinc-400 border border-white/[0.08] hover:border-[#0241ff]/40 hover:text-[#4d8aff]"
                  }`}
                >
                  {sub.icon}
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Detail Panel */}
            <AnimatePresence mode="wait">
              {activeSubsystem ? (
                <motion.div
                  key={activeSubsystem.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-white/[0.08] overflow-hidden flex-1"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(2,65,255,0.02) 100%)",
                  }}
                >
                  {/* Panel Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[#0241ff]/10 border border-[#0241ff]/20 text-[#4d8aff]">
                        {activeSubsystem.icon}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white tracking-tight">
                          {activeSubsystem.label}
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
                          {activeSubsystem.tagline}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveId(null);
                        setAutoRotate(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Panel Body */}
                  <div className="p-6 flex flex-col gap-5">
                    {/* Description */}
                    <p className="text-sm text-zinc-400 font-light leading-relaxed">
                      {activeSubsystem.description}
                    </p>

                    {/* Key Properties */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeSubsystem.details.map((detail, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center gap-2 text-xs text-zinc-500"
                        >
                          <ChevronRight className="w-3 h-3 text-[#0241ff] shrink-0" />
                          {detail}
                        </motion.div>
                      ))}
                    </div>

                    {/* Code Snippet */}
                    <div className="bg-black/50 rounded-xl p-4 overflow-x-auto border border-white/[0.04]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
                        </div>
                        <span className="text-[10px] text-zinc-600 font-mono ml-auto">
                          Move (Sui)
                        </span>
                      </div>
                      <pre className="text-xs font-mono text-blue-300/80 leading-relaxed whitespace-pre-wrap">
                        {activeSubsystem.codeSnippet}
                      </pre>
                    </div>

                    {/* Example Scenario */}
                    <div className="bg-[#0241ff]/[0.06] border border-[#0241ff]/[0.12] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3.5 h-3.5 text-[#4d8aff]" />
                        <span className="text-xs font-semibold text-[#4d8aff] uppercase tracking-wider">
                          Live Scenario
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-light leading-relaxed">
                        {activeSubsystem.example}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-dashed border-white/[0.06] flex-1 flex flex-col items-center justify-center gap-4 min-h-[400px]"
                  style={{ background: "rgba(255,255,255,0.01)" }}
                >
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <Activity className="w-8 h-8 text-zinc-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-zinc-500">
                      Select a subsystem to explore
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">
                      Click any node on the 3D model or use the pills above
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Feature Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            {
              icon: <Shield className="w-5 h-5 text-[#4d8aff]" />,
              title: "Trustless Safety",
              desc: "OwnerCap-gated kill switch — no admin backdoor, no override.",
            },
            {
              icon: <Lock className="w-5 h-5 text-[#4d8aff]" />,
              title: "Cryptographic Pinning",
              desc: "Every skill references a content-addressed Walrus blob.",
            },
            {
              icon: <Activity className="w-5 h-5 text-[#4d8aff]" />,
              title: "Atomic Accountability",
              desc: "PTBs ensure identity check + execution + logging are inseparable.",
            },
          ].map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.4 + i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="rounded-xl border border-white/[0.06] p-5 flex items-start gap-4 hover:border-[#0241ff]/25 transition-all"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="p-2.5 rounded-xl bg-[#0241ff]/[0.08] border border-[#0241ff]/15 shrink-0">
                {feat.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                  {feat.title}
                </h4>
                <p className="text-xs text-zinc-500 font-light leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade to next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-20"
        style={{
          background:
            "linear-gradient(to top, #f8f8f8 0%, transparent 100%)",
        }}
      />
    </section>
  );
}
