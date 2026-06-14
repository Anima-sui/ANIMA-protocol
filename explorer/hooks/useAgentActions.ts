import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface ActionItem {
  agentId: string;
  actionType: string;
  amount: string;
  timestamp: number;
  txDigest: string;
}

export function useAgentActions(agentId: string) {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentId) return;

    let isMounted = true;

    async function fetchActions() {
      try {
        const { data, error } = await supabase
          .from("agent_actions")
          .select("*")
          .eq("agent_object_id", agentId)
          .order("timestamp", { ascending: false })
          .limit(50);

        if (error) throw error;

        if (isMounted && data) {
          const formattedActions: ActionItem[] = data.map((item) => ({
            agentId: item.agent_object_id,
            actionType: item.action_type,
            amount: item.amount ? item.amount.toString() : "0",
            timestamp: new Date(item.timestamp).getTime(),
            txDigest: item.tx_digest,
          }));
          setActions(formattedActions);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching agent actions:", err);
      }
    }

    fetchActions();
    const interval = setInterval(fetchActions, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [agentId]);

  return { actions, loading };
}
