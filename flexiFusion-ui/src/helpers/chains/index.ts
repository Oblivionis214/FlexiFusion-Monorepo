/*
 * @Description: 
 * @Date: 2025-03-18 01:34:11
 * @Author: 李若愚
 * @LastEditors: 李若愚
 * @LastEditTime: 2025-03-29 17:01:33
 */
import {
  // RPC_ETH,
  // RPC_OPTIMISM,
  // RPC_BSC,
  RPC_BSC_TESTNET,
  // RPC_POLYGON,
  // RPC_FTM,
  // RPC_MOONRIVER,
  // RPC_BASE,
  // RPC_ARB,
  // RPC_AVAX,
  //RPC_KAVA,
  // PRC_LINEA,
  // RPC_BLAST,
  //RPC_BERA_BARTIO,
  // RPC_BERA,
} from "@/constants/rpc";

export const defaultRpc = {
  // 1: RPC_ETH,
  // 10: RPC_OPTIMISM,
  // 56: RPC_BSC,
  97: RPC_BSC_TESTNET, // BSC Testnet
  // 137: RPC_POLYGON,
  // 250: RPC_FTM,
  // 1285: RPC_MOONRIVER,
  // 8453: RPC_BASE,
  // 42161: RPC_ARB,
  // 43114: RPC_AVAX,
  //2222: RPC_KAVA,
  // 59144: PRC_LINEA,
  //80084: RPC_BERA_BARTIO,
  // 81457: RPC_BLAST,
  // 80094: RPC_BERA,
};

export const getRpcByChainId = (chainId: number): string =>
  defaultRpc[chainId as keyof typeof defaultRpc];
