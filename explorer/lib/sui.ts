import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { NETWORK } from "./constants";

export const suiClient = new SuiJsonRpcClient({
  url: getJsonRpcFullnodeUrl(NETWORK as any),
  network: NETWORK as any,
});
