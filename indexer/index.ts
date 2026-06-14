import { startEventPollingIndexer } from "./listener.js";

// Start the listener engine
startEventPollingIndexer().catch((error: any) => {
  console.error("Fatal error starting event indexer:", error);
  process.exit(1);
});
