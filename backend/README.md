# ANIMA Backend

The NestJS backend service for the ANIMA protocol. It handles agent action execution (swaps, transfers) on Sui, indexes on-chain events in real-time, and exposes REST endpoints consumed by the Explorer frontend and Ezekiel's agent orchestrator.

**Stack:** NestJS 11 · TypeScript (ESM) · Sui SDK · DeepBook V3 · Zod

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy env and fill in your values (see Environment section below)
cp .env.example .env

# Development (watch mode)
pnpm run start:dev

# Production build
pnpm run build
pnpm run start:prod
```

The server starts on `http://localhost:5000` by default.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AGENT_PRIVATE_KEY` | ✅ | Ed25519 private key for the agent signer. Supports `suiprivkey...` format or legacy base64. |
| `ANIMA_PACKAGE_ID` | ✅ | The deployed ANIMA Move package ID on Sui. |
| `ANIMA_OBJECT_ID` | — | Specific ANIMA object ID (for single-agent setups). |
| `DEEPBOOK_PACKAGE_ID` | — | DeepBook V3 package address. Defaults to `0x...dee9`. |
| `PORT` | — | Server port. Defaults to `5000`. |
| `SUI_NETWORK` | — | Sui network (`testnet` / `mainnet`). Defaults to `testnet`. |
| `USE_DEEPBOOK_FALLBACK` | — | Set to `true` to skip DeepBook and use a simple SUI split transfer instead. Useful for testing when pools aren't available. |
| `USE_EVENT_POLLING` | — | Set to `true` to use HTTP polling instead of WebSocket subscription for event indexing. Recommended for environments where WS is unreliable. |

---

## API Reference

### `GET /health`

Health check with Sui RPC connectivity status.

**Response:**
```json
// Healthy
{ "status": "ok", "sui": "connected", "timestamp": "2026-06-14T23:19:19.853Z" }

// Sui RPC unreachable
{ "status": "degraded", "sui": "unreachable", "timestamp": "2026-06-14T23:19:19.853Z" }
```

---

### `POST /agent/execute`

Execute an on-chain action (swap or transfer) on behalf of an ANIMA agent. Called by Ezekiel's orchestrator when the ML engine fires a signal.

**Request Body:**
```json
{
  "animaObjectId": "0x...",
  "skillName": "defi_swap",
  "actionType": "swap",
  "swapParams": {
    "poolId": "SUI_DBUSDC",
    "amountIn": 1000000,
    "minAmountOut": 900000,
    "coinTypeIn": "0x2::sui::SUI",
    "coinTypeOut": "0x...::dbusdc::DBUSDC"
  }
}
```

For transfers:
```json
{
  "animaObjectId": "0x...",
  "skillName": "transfer_funds",
  "actionType": "transfer",
  "transferParams": {
    "recipient": "0x...",
    "amount": 500000,
    "coinType": "0x2::sui::SUI"
  }
}
```

**Responses:**
```json
// 200 — Success
{ "status": "success", "txDigest": "ABC123..." }

// 400 — Validation error
{ "status": "failed", "error": "Validation failed: actionType: Invalid enum value..." }

// 403 — Agent is paused
{ "status": "failed", "error": "Agent 0x... is paused." }

// 404 — Agent not found on-chain
{ "status": "failed", "error": "ANIMA object 0x... not found on-chain." }

// 500 — Execution failure
{ "status": "failed", "error": "Transaction execution failed." }
```

**What happens internally:**
1. Request body is validated with Zod
2. Agent's pause status is checked on-chain (returns `403` early if paused)
3. A Programmable Transaction Block (PTB) is built:
   - `anima::verify_skill_auth` is called to authorize the skill
   - The action (swap via DeepBook or transfer via wallet extraction) is executed
   - `events::emit_action` is called to emit an on-chain event
4. The PTB is signed with the agent's private key and submitted to Sui

---

### `GET /agent/:id/events`

Returns cached on-chain events for a specific agent. Called by the Explorer every 5 seconds to populate the live action feed.

**Params:** `:id` must be a valid Sui object ID (`0x` + 64 hex characters)

**Response:**
```json
// 200 — Events found
{
  "agentId": "0x...",
  "events": [
    {
      "agentId": "0x...",
      "actionType": "SWAP",
      "amount": "1000000",
      "timestamp": 1718406000000,
      "txDigest": "ABC123..."
    }
  ],
  "count": 1
}

// 200 — No events yet (empty array, not 404)
{ "agentId": "0x...", "events": [], "count": 0 }

// 400 — Invalid object ID format
{ "status": "failed", "error": "Invalid Sui object ID format: bad-id" }
```

**Event action types:** `SWAP`, `COMPUTE`, `KILL_SWITCH`, `MINT`

---

### `GET /agent/:id/status`

Returns current live state of an ANIMA agent from the Sui blockchain. Called by the Explorer.

**Params:** `:id` must be a valid Sui object ID

**Response:**
```json
// 200 — Agent found
{
  "agentId": "0x...",
  "name": "Alpha Agent",
  "reputationScore": 95,
  "isPaused": false,
  "walletBalance": "50000000",
  "skills": ["defi_swap", "transfer_funds"]
}

// 404 — Agent not found
{ "status": "failed", "error": "ANIMA object 0x... not found on-chain." }

// 400 — Invalid ID format
{ "status": "failed", "error": "Invalid Sui object ID format: bad-id" }
```

> **Note:** This response is cached for 3 seconds to avoid hammering the Sui RPC when the explorer polls frequently. `walletBalance` is in MIST (1 SUI = 1,000,000,000 MIST).

---

## Project Structure

```
src/
├── main.ts                          # Bootstrap — CORS, global error filter
├── app.module.ts                    # Root module — registers all sub-modules
├── app.controller.ts                # GET /health
│
├── agent/                           # Agent API routes
│   ├── agent.module.ts              # AgentModule — imports PtbModule
│   ├── agent.controller.ts          # POST /execute, GET /:id/events, GET /:id/status
│   └── dto/
│       └── execute.dto.ts           # Zod validation schemas
│
├── sui/                             # Sui blockchain client (Global)
│   ├── sui.module.ts                # @Global() — available to all modules
│   └── sui.service.ts               # SuiJsonRpcClient, getObject, getObjectFields, getDynamicFields
│
├── deepbook/                        # DeepBook V3 DEX integration
│   ├── deepbook.module.ts
│   ├── deepbook.service.ts          # DeepBookClient, executeSwap (with fallback mode)
│   └── lib/
│       ├── swap.ts                  # buildDeepBookSwap, buildFallbackTransfer
│       └── constants.ts             # Pool keys, clock object ID
│
├── ptb/                             # Programmable Transaction Block builder
│   ├── ptb.module.ts                # Imports SuiModule + DeepbookModule
│   └── ptb.service.ts               # buildAndExecutePTB — the core execution engine
│
├── indexer/                         # On-chain event listener
│   ├── indexer.module.ts
│   └── indexer.service.ts           # WebSocket subscription + polling fallback
│
├── events/                          # In-memory event cache
│   └── store.ts                     # Map<agentId, AgentEvent[]> — 100 events per agent, de-duped
│
└── common/
    └── filters/
        └── global-exception.filter.ts  # Catches all errors → structured JSON
```

---

## Module Dependency Graph

```
AppModule
├── SuiModule (@Global)         ← shared Sui RPC client, injected everywhere
├── DeepbookModule              ← DEX swap layer
├── PtbModule                   ← depends on SuiModule + DeepbookModule
├── IndexerModule               ← depends on SuiModule, writes to event store
└── AgentModule                 ← depends on PtbModule, reads from event store
```

---

## How Things Connect

### Ezekiel (Agent Orchestrator) → Backend
Ezekiel's ML engine detects a signal → calls `POST /agent/execute` → backend builds a PTB → signs and submits to Sui → returns the transaction digest.

### Sui Blockchain → Backend (Event Indexer)
The `IndexerService` listens for Move events emitted by the ANIMA package on Sui. When an event fires (swap executed, agent minted, kill switch triggered, compute settled), it's parsed, normalized, and stored in the in-memory event cache.

### Backend → Explorer (Joshua's Frontend)
The Explorer polls two endpoints every ~5 seconds:
- `GET /agent/:id/events` — live action feed
- `GET /agent/:id/status` — agent state (name, reputation, paused status, balance, skills)

### Flow Diagram

```
Ezekiel (ML)                      Sui Blockchain                    Explorer (Next.js)
    │                                  │                                  │
    ├── POST /agent/execute ──────────>│ (PTB submitted)                  │
    │                                  │                                  │
    │                                  ├── Event emitted ──>  Indexer ──> │
    │                                  │                     (WS/Poll)    │
    │                                  │                                  │
    │                                  │     GET /agent/:id/events  <─────┤
    │                                  │     GET /agent/:id/status  <─────┤
    │                                  │     GET /health            <─────┤
```

---

## Error Handling

All errors return structured JSON — never raw stack traces:

```json
{
  "status": "failed",
  "error": "Human-readable error message",
  "timestamp": "2026-06-14T23:19:19.853Z"
}
```

- **Validation errors** → `400`
- **Agent paused** → `403`
- **Object not found on-chain** → `404`
- **Execution failures / RPC errors** → `500`
- All Sui RPC calls have a **10-second timeout** — the server fails fast instead of hanging

---

## Logging Conventions

All log messages use prefix tags for easy grepping:

| Tag | Module | Example |
|-----|--------|---------|
| `[API]` | AgentController | `[API] Execute called \| agent: 0x... \| skill: defi_swap \| action: swap` |
| `[PTB]` | PtbService | `[PTB] Success! Transaction Digest: ABC123...` |
| `[EVENT]` | IndexerService | `[EVENT] New action from agent 0x... \| type: SWAP \| tx: ABC123...` |
| `[INDEXER]` | IndexerService | `[INDEXER] WebSocket connection established` |
| `[DEEPBOOK]` | DeepbookService | `[DEEPBOOK] Building swap \| SUI → DBUSDC \| amount: 1000000` |
| `[HEALTH]` | AppController | `[HEALTH] Sui RPC check failed: timeout` |

---

## CORS

CORS is configured in `main.ts` to allow requests from:
- `http://localhost:3000` (Explorer dev server)
- `http://localhost:3001` (alternate port)
- `http://127.0.0.1:3000`

If you're running the Explorer on a different port or domain, update the `origin` array in `main.ts`.

---

## Event Indexer Modes

The indexer supports two modes, controlled by the `USE_EVENT_POLLING` env var:

| Mode | When to use | How it works |
|------|-------------|--------------|
| **WebSocket** (`false`) | Stable RPC connection available | Subscribes via `suix_subscribeEvent`. Auto-reconnects with exponential backoff (5s → 10s → 20s, 3 attempts). |
| **Polling** (`true`) | WebSocket unreliable or blocked | Queries `queryEvents` every 5 seconds with cursor-based pagination. Recommended for most dev environments. |

Both modes write to the same in-memory event store. The store de-duplicates by `txDigest` so running both simultaneously won't cause duplicate events.

---

## DeepBook Fallback Mode

Set `USE_DEEPBOOK_FALLBACK=true` in `.env` to skip DeepBook pools entirely. Instead of executing a real DEX swap, the PTB will perform a simple `splitCoins` from gas. This is useful for:
- Testing the full execution pipeline without needing live DeepBook pools
- Environments where DeepBook testnet pools are unavailable or broken

The fallback produces a valid on-chain transaction with events, so the indexer and explorer still work normally.
