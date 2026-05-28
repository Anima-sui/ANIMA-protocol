import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { suiClient, getObjectFields } from '../lib/sui';

// Load the agent's private key from the environment securely
const privateKey = process.env.AGENT_PRIVATE_KEY;

if (!privateKey) {
  throw new Error('AGENT_PRIVATE_KEY is missing in the environment variables');
}

// Decode the private key from the standard 'suiprivkey...' format
// This format is exported by Sui Wallet and starts with 'suiprivkey'
const { secretKey } = decodeSuiPrivateKey(privateKey);

// Instantiate the signer keypair using the extracted secret key
export const signer = Ed25519Keypair.fromSecretKey(secretKey);

export interface SwapParams {
  poolId: string;
  amountIn: number;
  minAmountOut: number;
  coinTypeIn: string;
  coinTypeOut: string;
}

export interface TransferParams {
  recipient: string;
  amount: number;
  coinType: string;
}

export interface ExecuteParams {
  animaObjectId: string;
  skillName: string;
  actionType: 'swap' | 'transfer';
  swapParams?: SwapParams;
  transferParams?: TransferParams;
}

/**
 * Builds and executes an atomic PTB (Programmable Transaction Block) on behalf of the agent.
 */
export async function buildAndExecutePTB(params: ExecuteParams) {
  // 0. Pre-flight check: Ensure agent is not paused
  const fields = await getObjectFields(params.animaObjectId) as any;
  if (!fields) {
    throw new Error(`[PTB] Could not fetch ANIMA object ${params.animaObjectId}`);
  }
  if (fields.is_paused) {
    console.error(`[PTB] Agent ${params.animaObjectId} is paused. Aborting execution.`);
    throw new Error(`Agent ${params.animaObjectId} is paused.`);
  }

  const tx = new Transaction();
  tx.setGasBudget(10_000_000); // Prevent runaway gas costs during testing

  const packageId = process.env.ANIMA_PACKAGE_ID;
  if (!packageId) throw new Error('ANIMA_PACKAGE_ID is missing');

  // 1. Verify skill authorization
  const [skillAuth] = tx.moveCall({
    target: `${packageId}::anima::verify_skill_auth`,
    arguments: [
      tx.object(params.animaObjectId),
      tx.pure.string(params.skillName),
    ],
  });

  // 2. Execute the action
  let actionResult;

  if (params.actionType === 'swap') {
    if (!params.swapParams) throw new Error('swapParams required for swap action');

    // Call DeepBook swap function (placeholder based on 2.2)
    // We will pass the skillAuth proof to authorize the swap
    const deepbookPackageId = process.env.DEEPBOOK_PACKAGE_ID || '0xdee9';
    const [swapCoin] = tx.moveCall({
      target: `${deepbookPackageId}::clob_v2::swap_exact_base_for_quote`,
      arguments: [
        tx.object(params.swapParams.poolId!),
        tx.pure.u64(params.swapParams.amountIn!),
        tx.object('0x8'), // SUI clock
        skillAuth,
      ],
    });

    tx.moveCall({
      target: `${packageId}::events::emit_action`,
      arguments: [
        tx.object(params.animaObjectId),
        swapCoin,
      ],
    });

    // We must deal with the swapped coin. For now, transfer to the agent's owner or back to the vault
    // But since it's a generic placeholder, we just transfer it to the signer
    tx.transferObjects([swapCoin], tx.pure.address(signer.toSuiAddress()));

  } else if (params.actionType === 'transfer') {
    if (!params.transferParams) throw new Error('transferParams required for transfer action');

    // Call wallet::extract_funds_for_action
    const [extractedCoin] = tx.moveCall({
      target: `${packageId}::wallet::extract_funds_for_action`,
      arguments: [
        tx.object(params.animaObjectId),
        tx.pure.u64(params.transferParams.amount),
      ],
    });
    
    // Explicitly transfer the extracted SUI to the recipient AFTER emission
    // Note: Sui requires passing references to events BEFORE moving the object fully
    tx.moveCall({
      target: `${packageId}::events::emit_action`,
      arguments: [
        tx.object(params.animaObjectId),
        extractedCoin,
      ],
    });

    tx.transferObjects([extractedCoin], tx.pure.address(params.transferParams.recipient));

  } else {
    throw new Error(`Unsupported actionType: ${params.actionType}`);
  }

  // Sign and execute the transaction
  const response = await suiClient.signAndExecuteTransaction({
    transaction: tx,
    signer: signer,
    options: {
      showEffects: true,
      showEvents: true,
    }
  });

  if (response.effects?.status.status === 'success') {
    console.log(`[PTB] Success! Transaction Digest: ${response.digest}`);
  } else {
    console.error(`[PTB] Failed execution! Error: ${response.effects?.status.error}`);
  }

  return response;
}
