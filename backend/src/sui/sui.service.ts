import { Injectable, Logger } from '@nestjs/common';
import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

const RPC_TIMEOUT_MS = 10_000; // 10 second timeout for all Sui RPC calls

/**
 * Wraps a promise with a timeout. Rejects if the promise doesn't resolve within `ms` milliseconds.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Sui RPC timed out after ${ms}ms`)), ms);
    promise
      .then((val) => { clearTimeout(timer); resolve(val); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

@Injectable()
export class SuiService {
  public readonly suiClient: SuiJsonRpcClient;
  private readonly logger = new Logger(SuiService.name);

  constructor() {
    this.suiClient = new SuiJsonRpcClient({ 
      url: getJsonRpcFullnodeUrl('testnet'),
      network: 'testnet' 
    });
  }

  /**
   * Helper function to fetch an object from the Sui network
   * We request showContent: true so that we can read the object's data
   */
  async getObject(objectId: string) {
    return withTimeout(
      this.suiClient.getObject({
        id: objectId,
        options: {
          showContent: true,
        },
      }),
      RPC_TIMEOUT_MS,
    );
  }

  /**
   * Helper function to fetch an object and immediately parse its fields
   * Returns the parsed fields if it's a Move object, otherwise returns null.
   */
  async getObjectFields(objectId: string) {
    const obj = await this.getObject(objectId);
    
    // Verify that the object exists and is a Move object with fields
    if (obj.data?.content?.dataType === 'moveObject') {
      return obj.data.content.fields;
    }
    
    return null;
  }

  /**
   * Fetches all dynamic fields attached to an object.
   * Used to read skill entries from the ANIMA object's dynamic field table.
   */
  async getDynamicFields(parentId: string) {
    const fields: any[] = [];
    let cursor: string | null | undefined = null;
    let hasNext = true;

    while (hasNext) {
      const page = await withTimeout(
        this.suiClient.getDynamicFields({
          parentId,
          cursor: cursor ?? undefined,
        }),
        RPC_TIMEOUT_MS,
      );

      fields.push(...page.data);
      hasNext = page.hasNextPage;
      cursor = page.nextCursor;
    }

    return fields;
  }
}
