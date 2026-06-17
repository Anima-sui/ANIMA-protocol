"use client";

import React, { useState, useRef, useEffect } from "react";
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

/* ─── NFA SUBSYSTEM DATA ─── */
interface NfaSubsystem {
  id: string;
  label: string;
  tagline: string;
  icon: React.ReactNode;
  color: string;
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
    color: "#0241ff",
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
    color: "#0241ff",
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
    color: "#0241ff",
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
    color: "#0241ff",
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
    color: "#0241ff",
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

/* ─── ANIMATED SVG ORBITAL RING ─── */
function OrbitalRing({
  radius,
  duration,
  reverse,
  opacity,
}: {
  radius: number;
  duration: number;
  reverse?: boolean;
  opacity: number;
}) {
  return (
    <motion.circle
      cx="200"
      cy="200"
      r={radius}
      fill="none"
      stroke="#0241ff"
      strokeWidth="0.5"
      strokeDasharray="4 8"
      strokeOpacity={opacity}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{ transformOrigin: "200px 200px" }}
    />
  );
}

/* ─── HOTSPOT NODE ─── */
function HotspotNode({
  cx,
  cy,
  subsystem,
  isActive,
  onClick,
  index,
}: {
  cx: number;
  cy: number;
  subsystem: NfaSubsystem;
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: 0.8 + index * 0.12,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ cursor: "pointer" }}
      onClick={onClick}
    >
      {/* Connection line to core */}
      <line
        x1="200"
        y1="200"
        x2={cx}
        y2={cy}
        stroke={isActive ? "#0241ff" : "#d4d4d8"}
        strokeWidth={isActive ? "1.5" : "0.5"}
        strokeDasharray={isActive ? "none" : "3 6"}
        style={{ transition: "all 0.3s ease" }}
      />

      {/* Outer pulse ring */}
      {isActive && (
        <motion.circle
          cx={cx}
          cy={cy}
          r="24"
          fill="none"
          stroke="#0241ff"
          strokeWidth="1"
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      )}

      {/* Node background */}
      <circle
        cx={cx}
        cy={cy}
        r="20"
        fill={isActive ? "#0241ff" : "#ffffff"}
        stroke={isActive ? "#0241ff" : "#e4e4e7"}
        strokeWidth={isActive ? "2" : "1"}
        style={{ transition: "all 0.3s ease" }}
      />

      {/* Icon placeholder — rendered as text abbreviation */}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9"
        fontWeight="600"
        fill={isActive ? "#ffffff" : "#71717a"}
        fontFamily="monospace"
        style={{ transition: "all 0.3s ease" }}
      >
        {subsystem.label.charAt(0)}
        {subsystem.label.split(" ")[1]?.charAt(0) || ""}
      </text>

      {/* Label */}
      <text
        x={cx}
        y={cy + 34}
        textAnchor="middle"
        fontSize="8"
        fontWeight="500"
        fill={isActive ? "#0241ff" : "#a1a1aa"}
        fontFamily="system-ui, sans-serif"
        style={{ transition: "all 0.3s ease" }}
      >
        {subsystem.label}
      </text>
    </motion.g>
  );
}

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
    }, 3500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRotate]);

  const handleNodeClick = (id: string) => {
    setAutoRotate(false);
    setActiveId(id === activeId ? null : id);
  };

  // Position nodes in a circle around the center
  const nodePositions = subsystems.map((_, i) => {
    const angle = (i / subsystems.length) * Math.PI * 2 - Math.PI / 2;
    const radius = 140;
    return {
      cx: 200 + Math.cos(angle) * radius,
      cy: 200 + Math.sin(angle) * radius,
    };
  });

  return (
    <section className="w-full bg-[#f8f8f8] text-[#171717] relative z-10 border-t border-zinc-200">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-24">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-[700px] mx-auto mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-px bg-[#0241ff]" />
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0241ff] uppercase tracking-wider">
              Interactive Architecture
            </span>
            <div className="w-12 h-px bg-[#0241ff]" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight leading-tight mb-4">
            Anatomy of a Non-Fungible Agent
          </h2>
          <p className="text-zinc-500 text-sm md:text-base font-light leading-relaxed">
            Explore each subsystem that makes an NFA a sovereign, accountable,
            autonomous on-chain entity. Click any node to inspect its
            architecture.
          </p>
        </motion.div>

        {/* Interactive Core */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* SVG Interactive Core — Left */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="relative w-full max-w-[400px] aspect-square">
              {/* Subtle background glow */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="w-48 h-48 rounded-full blur-3xl"
                  style={{
                    background: activeSubsystem
                      ? "rgba(2, 65, 255, 0.08)"
                      : "rgba(2, 65, 255, 0.03)",
                    transition: "background 0.5s ease",
                  }}
                />
              </div>

              <svg
                viewBox="0 0 400 400"
                className="w-full h-full"
                style={{ overflow: "visible" }}
              >
                {/* Orbital rings */}
                <OrbitalRing
                  radius={65}
                  duration={20}
                  opacity={0.15}
                />
                <OrbitalRing
                  radius={100}
                  duration={30}
                  reverse
                  opacity={0.1}
                />
                <OrbitalRing
                  radius={140}
                  duration={40}
                  opacity={0.08}
                />

                {/* Outer decorative ring */}
                <circle
                  cx="200"
                  cy="200"
                  r="170"
                  fill="none"
                  stroke="#e4e4e7"
                  strokeWidth="0.5"
                  strokeDasharray="2 12"
                />

                {/* Center core hexagon shape */}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.3,
                  }}
                  style={{ transformOrigin: "200px 200px" }}
                >
                  {/* Core outer ring */}
                  <circle
                    cx="200"
                    cy="200"
                    r="44"
                    fill="none"
                    stroke="#0241ff"
                    strokeWidth="1.5"
                    strokeOpacity="0.2"
                  />
                  {/* Core fill */}
                  <circle
                    cx="200"
                    cy="200"
                    r="40"
                    fill="white"
                    stroke="#0241ff"
                    strokeWidth="2"
                  />
                  {/* Inner icon circle */}
                  <circle
                    cx="200"
                    cy="200"
                    r="28"
                    fill="#0241ff"
                    fillOpacity="0.06"
                  />

                  {/* NFA label */}
                  <text
                    x="200"
                    y="195"
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="700"
                    fill="#0241ff"
                    fontFamily="monospace"
                  >
                    NFA
                  </text>
                  <text
                    x="200"
                    y="210"
                    textAnchor="middle"
                    fontSize="7"
                    fontWeight="400"
                    fill="#71717a"
                    fontFamily="system-ui, sans-serif"
                  >
                    Sovereign Object
                  </text>

                  {/* Core pulse */}
                  <motion.circle
                    cx="200"
                    cy="200"
                    r="40"
                    fill="none"
                    stroke="#0241ff"
                    strokeWidth="1"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ transformOrigin: "200px 200px" }}
                  />
                </motion.g>

                {/* Hotspot nodes */}
                {subsystems.map((sub, i) => (
                  <HotspotNode
                    key={sub.id}
                    cx={nodePositions[i].cx}
                    cy={nodePositions[i].cy}
                    subsystem={sub}
                    isActive={activeId === sub.id}
                    onClick={() => handleNodeClick(sub.id)}
                    index={i}
                  />
                ))}

                {/* Scanline effect */}
                <motion.line
                  x1="30"
                  y1="0"
                  x2="370"
                  y2="0"
                  stroke="#0241ff"
                  strokeWidth="0.5"
                  strokeOpacity="0.08"
                  animate={{ y1: [0, 400], y2: [0, 400] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </svg>
            </div>
          </motion.div>

          {/* Info Panel — Right */}
          <div className="lg:col-span-7 flex flex-col gap-6 min-h-[520px]">
            {/* Subsystem Navigation Pills */}
            <div className="flex flex-wrap gap-2">
              {subsystems.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleNodeClick(sub.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    activeId === sub.id
                      ? "bg-[#0241ff] text-white shadow-md shadow-[#0241ff]/15"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:border-[#0241ff]/30 hover:text-[#0241ff]"
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
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex-1"
                >
                  {/* Panel Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 border border-blue-100/50 text-[#0241ff]">
                        {activeSubsystem.icon}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
                          {activeSubsystem.label}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                          {activeSubsystem.tagline}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveId(null);
                        setAutoRotate(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Panel Body */}
                  <div className="p-6 flex flex-col gap-5">
                    {/* Description */}
                    <p className="text-sm text-zinc-600 font-light leading-relaxed">
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
                    <div className="bg-zinc-950 rounded-xl p-4 overflow-x-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                          Move (Sui)
                        </span>
                      </div>
                      <pre className="text-xs font-mono text-blue-200 leading-relaxed whitespace-pre-wrap">
                        {activeSubsystem.codeSnippet}
                      </pre>
                    </div>

                    {/* Example Scenario */}
                    <div className="bg-blue-50/40 border border-blue-100/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3.5 h-3.5 text-[#0241ff]" />
                        <span className="text-xs font-semibold text-[#0241ff] uppercase tracking-wider">
                          Live Scenario
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 font-light leading-relaxed">
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
                  className="bg-white/60 backdrop-blur-sm rounded-2xl border border-dashed border-zinc-200 flex-1 flex flex-col items-center justify-center gap-4 min-h-[400px]"
                >
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <Activity className="w-8 h-8 text-zinc-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-zinc-400">
                      Select a subsystem to explore
                    </p>
                    <p className="text-xs text-zinc-300 mt-1">
                      Click any node on the diagram or use the pills above
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
              icon: <Shield className="w-5 h-5 text-[#0241ff]" />,
              title: "Trustless Safety",
              desc: "OwnerCap-gated kill switch — no admin backdoor, no override.",
            },
            {
              icon: <Lock className="w-5 h-5 text-[#0241ff]" />,
              title: "Cryptographic Pinning",
              desc: "Every skill references a content-addressed Walrus blob.",
            },
            {
              icon: <Activity className="w-5 h-5 text-[#0241ff]" />,
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
              className="bg-white rounded-xl border border-zinc-200 p-5 flex items-start gap-4 hover:border-[#0241ff]/20 hover:shadow-sm transition-all"
            >
              <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100/30 shrink-0">
                {feat.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 mb-1">
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
    </section>
  );
}
