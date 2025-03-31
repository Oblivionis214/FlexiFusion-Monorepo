import { BlockTag } from "@ethersproject/providers";
import { MulticallVersion } from "./multicall-provider";
export declare const getBlockNumber: (blockTag: BlockTag) => number | null;
export declare const getMulticallVersion: (blockNumber: number | null, chainId: number) => MulticallVersion | null;
