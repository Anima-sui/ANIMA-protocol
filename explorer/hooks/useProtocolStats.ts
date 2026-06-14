import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface ProtocolStats {
  totalAgents: number;
  totalActive: number;
  totalPaused: number;
  totalActions: number;
  totalVolume: string; // BigInt as string
}

export function useProtocolStats() {
  const [stats, setStats] = useState<ProtocolStats>({
    totalAgents: 0,
    totalActive: 0,
    totalPaused: 0,
    totalActions: 0,
    totalVolume: "0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        const { data, error } = await supabase
          .from("protocol_stats")
          .select("*")
          .eq("id", 1)
          .single();

        if (error) throw error;

        if (isMounted && data) {
          setStats({
            totalAgents: parseInt(data.total_agents || "0"),
            totalActive: parseInt(data.total_active || "0"),
            totalPaused: parseInt(data.total_paused || "0"),
            totalActions: parseInt(data.total_actions || "0"),
            totalVolume: (data.total_volume || "0").toString(),
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching protocol stats:", err);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { stats, loading };
}
