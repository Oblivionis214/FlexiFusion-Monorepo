/*
 * @Description: 
 * @Date: 2025-03-30 10:44:03
 * @Author: 李若愚
 * @LastEditors: 李若愚
 * @LastEditTime: 2025-03-31 02:15:49
 */
import { useImage } from "@/helpers/useImage";
import erc20Abi from "@/abis/farm/erc20Abi";

export const binanceTestnetTokens = {
  USD: {
    name: "USD",
    symbol: "USD",
    decimals: 18,
    address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd", // BNB Smart Chain Testnet USD 代币地址
    abi: "erc20",
    icon: useImage("assets/images/tokens/USD.png"),
  },
  BNB: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
    address: "0x0000000000000000000000000000000000000000", // 原生 BNB
    abi: "native",
    icon: useImage("assets/images/tokens/BNB.png"),
  },
  Stable: {
    name: "Stable",
    chainId: 97,
    address: "0x1d81BaaBF0aC77C42bf1fB77943526ece1aEAa01",
    icon: useImage("assets/images/tokens/Stable.png"),
    abi: erc20Abi,
    decimals: 18,
  },
  "Wrapped Ether": {
    name: "Wrapped Ether",
    chainId: 97,
    address: "0xafa8399499B2EE41A04eD98C59Db1e0E65cB73C1",
    icon: useImage("assets/images/tokens/WETH.png"),
    abi: erc20Abi,
    decimals: 18,
  }
}; 