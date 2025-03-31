/*
 * @Description: 
 * @Date: 2025-03-18 01:34:11
 * @Author: 李若愚
 * @LastEditors: 李若愚
 * @LastEditTime: 2025-03-30 19:25:02
 */
import type { Address } from "viem";

export const routers = {
  97: "0x94Ea0183A3268635E34332A76DD2e9Eff13A00f4" as Address,  // BSC Testnet
  168587773: "0x15f57fbCB7A443aC6022e051a46cAE19491bC298" as Address,
  81457: "0x94Ea0183A3268635E34332A76DD2e9Eff13A00f4" as Address,
  42161: "0x63d8e76143a1fd075981A44e27652aDffEE09F01" as Address,
  // 42161: "0xE6b710c2c1657938D0b6443ac14e593BAcA43E6A" as Address,
  2222: "0x526a17c623809792c033c9816Ae9a6fA80aCDfdd" as Address,
  1: "0x7202B7ca846fc93467E95fa279bC6085F2d5b6FE" as Address,
};

export const getSwapRouterByChain = (chainId: number): Address => {
  switch (chainId) {
    case 97:  // BSC Testnet
      return routers[97];
    case 168587773:
      return routers[168587773];
    case 81457:
      return routers[81457];
    case 42161:
      return routers[42161];
    case 2222:
      return routers[2222];
    case 1:
      return routers[1];
    default:
      throw new Error("ChainId not supported");
  }
};
