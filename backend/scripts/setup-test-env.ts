import { Transaction } from '@mysten/sui/transactions';
import { signer } from '../src/ptb/executor';
import { suiClient } from '../src/lib/sui';
import * as dotenv from 'dotenv';
dotenv.config();

async function setup() {
  const packageId = process.env.ANIMA_PACKAGE_ID;
  if (!packageId) throw new Error('ANIMA_PACKAGE_ID missing');

  console.log('1. Minting ANIMA agent...');
  const tx = new Transaction();
  
  // Call mint_agent
  const [anima, ownerCap, backendCap] = tx.moveCall({
    target: `${packageId}::protocol::mint_agent`,
    arguments: [tx.pure.string('TestAgent')],
  });

  // Transfer capabilities to ourselves
  tx.transferObjects([anima, ownerCap, backendCap], tx.pure.address(signer.toSuiAddress()));

  const res = await suiClient.signAndExecuteTransaction({
    transaction: tx,
    signer,
    options: { showEffects: true, showObjectChanges: true },
  });

  if (res.effects?.status.status !== 'success') {
    console.error('Minting failed', res.effects?.status.error);
    return;
  }

  // Find the ANIMA object ID from objectChanges
  const createdObjects = res.objectChanges?.filter(o => o.type === 'created');
  const animaObj = createdObjects?.find(o => 'objectType' in o && o.objectType.includes('::protocol::ANIMA'));
  
  if (!animaObj || !('objectId' in animaObj)) {
    console.error('Could not find ANIMA object ID in response');
    return;
  }
  
  const animaId = animaObj.objectId;
  console.log(`✅ Minted ANIMA! ID: ${animaId}`);

  console.log('2. Funding ANIMA agent with 0.1 SUI...');
  const tx2 = new Transaction();
  const [coin] = tx2.splitCoins(tx2.gas, [tx2.pure.u64(100_000_000)]);
  
  tx2.moveCall({
    target: `${packageId}::wallet::deposit_funds`,
    arguments: [
      tx2.object(animaId),
      coin,
    ],
  });

  const res2 = await suiClient.signAndExecuteTransaction({
    transaction: tx2,
    signer,
    options: { showEffects: true },
  });

  if (res2.effects?.status.status === 'success') {
    console.log('✅ Funded ANIMA successfully!');
    console.log(`\nUpdate your .env file with:`);
    console.log(`ANIMA_OBJECT_ID=${animaId}`);
  } else {
    console.error('Funding failed', res2.effects?.status.error);
  }
}

setup().catch(console.error);
