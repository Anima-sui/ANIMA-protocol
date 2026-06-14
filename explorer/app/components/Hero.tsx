"use client";

import { Cpu, Activity, Database, Search } from "lucide-react";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useProtocolStats } from "@/hooks/useProtocolStats";
import { formatAmount } from "@/lib/utils";

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { stats, loading } = useProtocolStats();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/agents/${query}`);
  };

  const totalVolumeSui = parseFloat(stats.totalVolume) / 1_000_000_000;

  return (
    <section className="py-12">
      <div className="relative z-10">
        {/* Title */}
        <h1 className="mt-12 text-center text-4xl max-sm:mt-8 max-sm:text-2xl">
          Explore the Agentic Sui Blockchain
        </h1>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="relative z-50 mx-auto mt-8 max-w-[730px] max-sm:px-4"
        >
          <div style={{ height: "56px" }}>
            <div className="relative rounded-full">
              <input
                type="text"
                placeholder="Search by ANIMA Object ID (0x...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full bg-foreground p-6 text-sm shadow-#1 backdrop-blur-sm placeholder:font-normal text-background h-[56px] pr-[128px] focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <span
                className="absolute flex h-7 w-7 items-center justify-center rounded-md bg-[#0241ff]/40 primary-text max-sm:hidden top-1/2 -translate-y-1/2 transform"
                style={{ right: "100px" }}
              >
                /
              </span>
              <button
                type="submit"
                className="absolute primary-button cursor-pointer right-1 top-1 flex items-center justify-center rounded-full h-12 w-[76px] hover:opacity-90 transition-opacity"
              >
                <Search />
              </button>
            </div>
          </div>
        </form>

        {/* Stats Grid */}
        <ul className="grid gap-4 whitespace-nowrap max-xl:grid-cols-2 max-sm:mt-16 max-sm:grid-cols-1 mt-20 grid-cols-3 max-md:mt-24 px-4">
          {/* Card 1: Total Agents (NFAs) */}
          <li className="rounded-2xl glass-card shadow-#1 overflow-hidden">
            <div className="flex items-center p-5 pb-3">
              <div className="mr-3 rounded-full p-2.5 text-[#6fa0ff] bg-[#0241ff]/10">
                <Cpu />
              </div>
              <div>
                <h4 className="text-sm text-secondary">Total Agents (NFAs)</h4>
                <div className="whitespace-nowrap text-lg font-medium">
                  {loading ? "..." : stats.totalAgents.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="m-2 rounded-lg p-3 text-sm">
              <p className="text-secondary">Network Status</p>
              <div className="mt-1 font-medium text-emerald-400">
                Live & Syncing
              </div>
              <div
                className="my-3"
                style={{
                  height: "1px",
                  backgroundImage:
                    "linear-gradient(to right, var(--dashed-border-color) 4px, transparent 3px)",
                  backgroundSize: "10px 1px",
                  backgroundRepeat: "repeat-x",
                }}
              ></div>
              <div className="flex justify-between">
                <div>
                  <p className="text-secondary">Active Loops</p>
                  <div className="mt-1 font-medium">
                    {loading ? "..." : stats.totalActive.toLocaleString()}
                  </div>
                </div>
                <div>
                  <p className="text-secondary">Paused / Killed</p>
                  <div className="mt-1 font-medium">
                    {loading ? "..." : stats.totalPaused.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </li>

          {/* Card 2: Autonomous Operations */}
          <li className="rounded-2xl glass-card shadow-#1 overflow-hidden">
            <div className="flex items-center p-5 pb-3">
              <div className="mr-3 rounded-full p-2.5 text-[#6fa0ff] bg-[#0241ff]/10">
                <Activity />
              </div>
              <div>
                <h4 className="text-sm text-secondary">
                  Autonomous Operations
                </h4>
                <div className="whitespace-nowrap text-lg font-medium">
                  {loading ? "..." : stats.totalActions.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="m-2 rounded-lg p-3 text-sm">
              <p className="text-secondary">Avg. Operation Latency</p>
              <div className="mt-1 font-medium">~1.5s</div>
              <div
                className="my-3"
                style={{
                  height: "1px",
                  backgroundImage:
                    "linear-gradient(to right, var(--dashed-border-color) 4px, transparent 3px)",
                  backgroundSize: "10px 1px",
                  backgroundRepeat: "repeat-x",
                }}
              ></div>
              <div className="flex justify-between">
                <div>
                  <p className="text-secondary">Total Volume</p>
                  <div className="mt-1 font-medium font-mono text-xs">
                    {loading ? "..." : `${totalVolumeSui.toLocaleString(undefined, { maximumFractionDigits: 2 })} SUI`}
                  </div>
                </div>
                <div>
                  <p className="text-secondary">Avg. Gas Sync</p>
                  <div className="mt-1 font-medium">0.0009 SUI</div>
                </div>
              </div>
            </div>
          </li>

          {/* Card 3: Skill Storage */}
          <li className="rounded-2xl glass-card shadow-#1 overflow-hidden">
            <div className="flex items-center p-5 pb-3">
              <div className="mr-3 rounded-full p-2.5 text-[#6fa0ff] bg-[#0241ff]/10">
                <Database />
              </div>
              <div>
                <h4 className="text-sm text-secondary">
                  Walrus Skill Registry
                </h4>
                <div className="text-lg font-medium">
                  {loading ? "..." : `${stats.totalAgents} Blobs`}
                </div>
              </div>
            </div>
            <div className="m-2 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <div>
                  <p className="text-secondary">Storage Model</p>
                  <div className="mt-1 font-medium">Decentralized</div>
                </div>
                <div>
                  <p className="text-secondary">Indexer Rate</p>
                  <div className="mt-1 font-medium text-emerald-400">
                    100% (Sync)
                  </div>
                </div>
              </div>
              <div
                className="my-3"
                style={{
                  height: "1px",
                  backgroundImage:
                    "linear-gradient(to right, var(--dashed-border-color) 4px, transparent 3px)",
                  backgroundSize: "10px 1px",
                  backgroundRepeat: "repeat-x",
                }}
              ></div>
              <div className="flex justify-between">
                <div>
                  <p className="text-secondary">Blob Ingest Rate</p>
                  <div className="mt-1 font-medium">9.2 / Min</div>
                </div>
                <div>
                  <p className="text-secondary">Query Speed</p>
                  <div className="mt-1 font-medium">120ms</div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default Hero;
