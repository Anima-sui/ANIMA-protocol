import { DeepBookClient } from '@mysten/deepbook-v3';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

const client = new SuiClient({ url: getFullnodeUrl('testnet') });
const deepbook = new DeepBookClient({ client, env: 'testnet' });

console.log(deepbook.pools);
