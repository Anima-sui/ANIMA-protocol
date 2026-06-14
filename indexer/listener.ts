import { getJsonRpcFullnodeUrl, SuiJsonRpcClient as SuiClient } from "@mysten/sui/jsonRpc";
import {
  handleAnimaMinted,
  handleAgentActionExecuted,
  handleEmergencyHatch,
  handleComputeSettled,
  syncGlobalStats,
} from "./handlers.js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_ID = process.env.PACKAGE_ID || "";
const NETWORK = process.env.NETWORK || "testnet";
const rpcUrl = getJsonRpcFullnodeUrl(NETWORK as any);
const client = new SuiClient({ url: rpcUrl, network: NETWORK as any });

const CURSOR_FILE = path.join(__dirname, "cursor.json");

function loadCursor(): any {
  if (fs.existsSync(CURSOR_FILE)) {
    try {
      const content = fs.readFileSync(CURSOR_FILE, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to load indexer cursor, starting fresh:", e);
    }
  }
  return null;
}

function saveCursor(cursor: any) {
  try {
    fs.writeFileSync(CURSOR_FILE, JSON.stringify(cursor, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save indexer cursor:", e);
  }
}

export async function startEventPollingIndexer() {
  console.log(`🚀 ANIMA event indexing engine started on Sui ${NETWORK}...`);
  console.log(`📦 Listening for events in package: ${PACKAGE_ID}`);

  // Run initial global stats sync
  await syncGlobalStats();

  let nextCursor = loadCursor();

  setInterval(async () => {
    try {
      const eventResponse = await client.queryEvents({
        query: { MoveEventModule: { package: PACKAGE_ID, module: "events" } },
        cursor: nextCursor,
        order: "ascending",
      });

      if (eventResponse.data.length > 0) {
        console.log(`📡 Ingested ${eventResponse.data.length} new events.`);

        for (const ev of eventResponse.data) {
          const type = ev.type;
          if (type === `${PACKAGE_ID}::events::AnimaMinted`) {
            await handleAnimaMinted(client, ev);
          } else if (type === `${PACKAGE_ID}::events::AgentActionExecuted`) {
            await handleAgentActionExecuted(client, ev);
          } else if (type === `${PACKAGE_ID}::events::EmergencyHatchTriggered`) {
            await handleEmergencyHatch(client, ev);
          } else if (type === `${PACKAGE_ID}::events::ComputeSettled`) {
            await handleComputeSettled(client, ev);
          } else {
            console.log(`⚠️ Unhandled event type: ${type}`);
          }
        }

        nextCursor = eventResponse.nextCursor;
        saveCursor(nextCursor);
      }
    } catch (error) {
      console.error("✖ Indexer polling cycle encountered an anomaly:", error);
    }
  }, 3000); // Poll every 3 seconds
}
