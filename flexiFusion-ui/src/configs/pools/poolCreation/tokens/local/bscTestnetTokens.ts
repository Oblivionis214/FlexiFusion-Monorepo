import erc20Abi from "@/abis/farm/erc20Abi";
import { useImage } from "@/helpers/useImage";
import type { PoolCreationTokenConfig } from "@/configs/pools/poolCreation/types";
import { BSC_TESTNET_CHAIN_ID } from "@/constants/global";

const bscTestnetTokens: Array<PoolCreationTokenConfig> = [
  {
    chainId: BSC_TESTNET_CHAIN_ID,
    address: "0x1d81BaaBF0aC77C42bf1fB77943526ece1aEAa01",
    name: "Stable",
    symbol: "Stable",
    icon: useImage(`assets/images/tokens/Stable.png`),
    decimals: 18,
    abi: erc20Abi,
    isPopular: true,
  },
  {
    chainId: BSC_TESTNET_CHAIN_ID,
    address: "0xafa8399499B2EE41A04eD98C59Db1e0E65cB73C1",
    name: "Wrapped Ether",
    symbol: "WETH",
    icon: useImage(`assets/images/tokens/WETH.png`),
    decimals: 18,
    abi: erc20Abi,
    isPopular: true,
  },
];

export default bscTestnetTokens; 