import { Injectable, Logger } from '@nestjs/common';
import { DeepBookClient } from '@mysten/deepbook-v3';
import { Transaction } from '@mysten/sui/transactions';
import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { buildDeepBookSwap, buildFallbackTransfer, SwapParams } from './lib/swap.js';

@Injectable()
export class DeepbookService {
  public readonly deepBookClient: DeepBookClient;
  private readonly useFallback: boolean;
  private readonly logger = new Logger(DeepbookService.name);

  constructor() {
    this.useFallback = process.env.USE_DEEPBOOK_FALLBACK === 'true';

    const suiClient = new SuiJsonRpcClient({
      url: getJsonRpcFullnodeUrl('testnet'),
      network: 'testnet',
    });

    this.deepBookClient = new DeepBookClient({
      client: suiClient,
      address: process.env.DEEPBOOK_PACKAGE_ID || '0x000000000000000000000000000000000000000000000000000000000000dee9',
      network: 'testnet',
    } as any);

    this.logger.log(`[DEEPBOOK] Initialized | fallback mode: ${this.useFallback}`);
  }

  /**
   * Executes a swap by automatically routing to DeepBook or the fallback transfer
   * based on the USE_DEEPBOOK_FALLBACK feature flag in .env.
   */
  public executeSwap(tx: Transaction, params: SwapParams): any {
    if (this.useFallback) {
      this.logger.log(`[DEEPBOOK] Using fallback transfer | amount: ${params.amountIn}`);
      // The PTB executor logic expects to receive the split coin array [coin]
      return buildFallbackTransfer(tx, { amount: params.amountIn });
    }

    this.logger.log(`[DEEPBOOK] Building swap | ${params.fromToken} → ${params.toToken} | amount: ${params.amountIn} | pool: ${params.poolId}`);
    return buildDeepBookSwap(tx, this.deepBookClient.deepBook, params);
  }
}
