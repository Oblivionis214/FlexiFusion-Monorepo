/*
 * @Description: 
 * @Date: 2025-03-18 01:34:11
 * @Author: 李若愚
 * @LastEditors: 李若愚
 * @LastEditTime: 2025-03-30 10:31:16
 */
import { bsc } from "@wagmi/core/chains";
import { useImage } from "@/helpers/useImage";
import { filterRpcUrls } from "@/helpers/chains/utils";
import { initPublicClient } from "@/helpers/chains/initPublicClient";
import { initStaticJsonRpcProvider } from "@/helpers/chains/initStaticJsonRpcProvider";

const rpcList = filterRpcUrls(bsc, [
  "https://data-seed-prebsc-2-s1.bnbchain.org:8545",
  // "https://bsc-dataseed1.ninicoin.io",
  // "https://bsc-dataseed2.ninicoin.io",
  // "https://bsc-dataseed3.ninicoin.io",
  // "https://binance.llamarpc.com",
]);

const viemConfig = {
  ...bsc,
  rpcUrls: {
    public: {
      http: rpcList,
    },
    default: {
      http: rpcList,
    },
  },
};

const publicClient = initPublicClient(viemConfig);
const ethersProvider = await initStaticJsonRpcProvider(bsc.id);

export const binanceConfig = {
  publicClient,
  ethersProvider,
  viemConfig: viemConfig,
  chainId: bsc.id,
  chainName: "BNB Chain",
  symbol: "BSC",
  icon: useImage("assets/images/networks/binance-icon.svg"),
  baseTokenIcon: useImage("assets/images/tokens/BNB.png"),
  baseTokenSymbol: "BNB",
  networkIcon: useImage(`assets/images/networks/binance.svg`),
  lzChainId: 102,
};
