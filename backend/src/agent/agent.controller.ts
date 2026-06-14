import { Controller, Post, Get, Body, Param, Res, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { PtbService } from '../ptb/ptb.service.js';
import { SuiService } from '../sui/sui.service.js';
import { ExecuteSchema } from './dto/execute.dto.js';
import { getEvents } from '../events/store.js';

// Sui object IDs are 66 chars: 0x + 64 hex digits
const SUI_OBJECT_ID_REGEX = /^0x[a-fA-F0-9]{64}$/;

// Simple in-memory cache for agent status responses
const statusCache = new Map<string, { data: any; expiresAt: number }>();
const STATUS_CACHE_TTL_MS = 3000; // 3 seconds

@Controller('agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(
    private readonly ptbService: PtbService,
    private readonly suiService: SuiService,
  ) {}

  // ─── POST /agent/execute ──────────────────────────────────────────────

  @Post('execute')
  async execute(@Body() body: unknown, @Res() res: Response) {
    // 1. Validate request body with Zod
    const parsed = ExecuteSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map(
        (i) => `${i.path.join('.')}: ${i.message}`,
      );
      return res.status(400).json({
        status: 'failed',
        error: `Validation failed: ${errors.join('; ')}`,
      });
    }

    const dto = parsed.data;

    this.logger.log(
      `[API] Execute called | agent: ${dto.animaObjectId} | skill: ${dto.skillName} | action: ${dto.actionType}`,
    );

    // 2. Pre-flight pause check at route level (return 403, not a generic 500)
    try {
      const fields = (await this.suiService.getObjectFields(
        dto.animaObjectId,
      )) as any;

      if (!fields) {
        return res.status(404).json({
          status: 'failed',
          error: `ANIMA object ${dto.animaObjectId} not found on-chain.`,
        });
      }

      if (fields.is_paused) {
        this.logger.warn(
          `[API] Agent ${dto.animaObjectId} is paused. Rejecting execute request.`,
        );
        return res.status(403).json({
          status: 'failed',
          error: `Agent ${dto.animaObjectId} is paused.`,
        });
      }
    } catch (err) {
      this.logger.error(
        `[API] Failed to fetch agent state for pause check: ${err}`,
      );
      return res.status(500).json({
        status: 'failed',
        error: 'Failed to verify agent state before execution.',
      });
    }

    // 3. Execute the PTB
    try {
      const response = await this.ptbService.buildAndExecutePTB({
        animaObjectId: dto.animaObjectId,
        skillName: dto.skillName,
        actionType: dto.actionType,
        swapParams: dto.swapParams,
        transferParams: dto.transferParams,
      });

      if (response.effects?.status.status === 'success') {
        return res.status(200).json({
          status: 'success',
          txDigest: response.digest,
        });
      } else {
        return res.status(500).json({
          status: 'failed',
          error: response.effects?.status.error || 'Transaction execution failed.',
        });
      }
    } catch (err: any) {
      this.logger.error(`[API] Execute failed for agent ${dto.animaObjectId}: ${err.message}`);
      return res.status(500).json({
        status: 'failed',
        error: err.message || 'Unexpected error during PTB execution.',
      });
    }
  }

  // ─── GET /agent/:id/events ────────────────────────────────────────────

  @Get(':id/events')
  getAgentEvents(@Param('id') agentId: string, @Res() res: Response) {
    // Validate Sui object ID format
    if (!SUI_OBJECT_ID_REGEX.test(agentId)) {
      return res.status(400).json({
        status: 'failed',
        error: `Invalid Sui object ID format: ${agentId}`,
      });
    }

    const events = getEvents(agentId);

    // Always return 200 with an array (empty or populated) — never 404
    return res.status(200).json({
      agentId,
      events,
      count: events.length,
    });
  }

  // ─── GET /agent/:id/status ────────────────────────────────────────────

  @Get(':id/status')
  async getAgentStatus(@Param('id') agentId: string, @Res() res: Response) {
    // Validate Sui object ID format
    if (!SUI_OBJECT_ID_REGEX.test(agentId)) {
      return res.status(400).json({
        status: 'failed',
        error: `Invalid Sui object ID format: ${agentId}`,
      });
    }

    // Check cache first (3-second TTL)
    const cached = statusCache.get(agentId);
    if (cached && Date.now() < cached.expiresAt) {
      return res.status(200).json(cached.data);
    }

    try {
      // Fetch ANIMA object fields from on-chain
      const fields = (await this.suiService.getObjectFields(agentId)) as any;

      if (!fields) {
        return res.status(404).json({
          status: 'failed',
          error: `ANIMA object ${agentId} not found on-chain.`,
        });
      }

      // Extract core fields (field names match the root /indexer handlers.ts patterns)
      const name: string = fields.name || 'Unknown';
      const reputationScore: number = parseInt(fields.reputation_score || '0', 10);
      const isPaused: boolean = !!fields.is_paused;

      // wallet_balance may be a nested Balance object with a `value` field,
      // or a direct numeric field depending on the Move struct layout
      const rawBalance = fields.wallet_balance?.fields?.value ?? fields.wallet_balance ?? '0';
      const walletBalance: string = String(rawBalance);

      // Fetch skills from dynamic fields
      let skills: string[] = [];
      try {
        // The ANIMA object may store skills in a dynamic field table (e.g. `skills` field).
        // If `skills` is a Table/Bag, its object ID is stored as a field — we read its children.
        const skillsTableId = fields.skills?.fields?.id?.id ?? fields.skills;
        if (skillsTableId && typeof skillsTableId === 'string') {
          const dynamicFields = await this.suiService.getDynamicFields(skillsTableId);
          skills = dynamicFields.map((df: any) => {
            // Dynamic field names are typically stored in the `name` property
            return df.name?.value ?? df.name ?? 'unknown';
          });
        }
      } catch (err) {
        this.logger.warn(`[API] Could not fetch skills for agent ${agentId}: ${err}`);
        // Non-fatal — return empty skills array
      }

      const responseData = {
        agentId,
        name,
        reputationScore,
        isPaused,
        walletBalance,
        skills,
      };

      // Cache the response for 3 seconds
      statusCache.set(agentId, {
        data: responseData,
        expiresAt: Date.now() + STATUS_CACHE_TTL_MS,
      });

      return res.status(200).json(responseData);
    } catch (err: any) {
      this.logger.error(`[API] Failed to fetch status for agent ${agentId}: ${err.message}`);
      return res.status(500).json({
        status: 'failed',
        error: 'Failed to fetch agent status from Sui.',
      });
    }
  }
}
