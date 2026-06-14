import { z } from 'zod';

const SwapParamsSchema = z.object({
  poolId: z.string(),
  amountIn: z.number(),
  minAmountOut: z.number(),
  coinTypeIn: z.string(),
  coinTypeOut: z.string(),
});

const TransferParamsSchema = z.object({
  recipient: z.string(),
  amount: z.number(),
  coinType: z.string(),
});

export const ExecuteSchema = z.object({
  animaObjectId: z.string(),
  skillName: z.string(),
  actionType: z.enum(['swap', 'transfer']),
  swapParams: SwapParamsSchema.optional(),
  transferParams: TransferParamsSchema.optional(),
});

export type ExecuteDto = z.infer<typeof ExecuteSchema>;
