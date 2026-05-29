export interface AgentEvent {
  agentId: string;
  actionType: string;
  amount: string; // amount is a string type as per requirements
  timestamp: number;
  txDigest: string;
}

const store = new Map<string, AgentEvent[]>();

export function addEvent(event: AgentEvent): void {
  if (!event.agentId) return;
  
  const events = store.get(event.agentId) || [];
  
  // Avoid duplicate event insertions if WS subscription and Polling overlap
  const exists = events.some((e) => e.txDigest === event.txDigest);
  if (exists) return;

  events.unshift(event);
  
  // Ensure strict newest-first sorting (timestamp descending)
  events.sort((a, b) => b.timestamp - a.timestamp);

  // Cap storage at 100 events per agent to prevent memory bloat
  if (events.length > 100) {
    events.pop();
  }

  store.set(event.agentId, events);
}

export function getEvents(agentId: string): AgentEvent[] {
  const events = store.get(agentId) || [];
  return [...events];
}
