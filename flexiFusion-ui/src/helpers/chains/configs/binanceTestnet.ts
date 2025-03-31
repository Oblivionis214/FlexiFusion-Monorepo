/*
 * @Description: 
 * @Date: 2025-03-30 10:36:38
 * @Author: 李若愚
 * @LastEditors: 李若愚
 * @LastEditTime: 2025-03-30 10:44:08
 */
import { useImage } from "@/helpers/useImage";
import { filterRpcUrls } from "@/helpers/chains/utils";
import { initPublicClient } from "@/helpers/chains/initPublicClient";
import { initStaticJsonRpcProvider } from "@/helpers/chains/initStaticJsonRpcProvider";

const rpcList = [
  "https://data-seed-prebsc-2-s1.bnbchain.org:8545"
];

const viemConfig = {
  id: 97,
  name: 'BNB Smart Chain Testnet',
  network: 'bscTestnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    public: {
      http: rpcList,
    },
    default: {
      http: rpcList,
    },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://testnet.bscscan.com' },
  },
  testnet: true,
};

const publicClient = initPublicClient(viemConfig);
const ethersProvider = await initStaticJsonRpcProvider(97);

export const binanceTestnetConfig = {
  publicClient,
  ethersProvider,
  viemConfig: viemConfig,
  chainId: 97,
  chainName: "BNB Smart Chain Testnet",
  symbol: "BSC",
  icon: useImage("assets/images/networks/binance-icon.svg"),
  baseTokenIcon: useImage("assets/images/tokens/BNB.png"),
  baseTokenSymbol: "BNB",
  networkIcon: useImage(`assets/images/networks/binance.svg`),
  lzChainId: 101,
}; 