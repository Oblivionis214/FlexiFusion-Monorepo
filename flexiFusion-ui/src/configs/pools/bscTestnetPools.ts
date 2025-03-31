/*
 * @Description: 
 * @Date: 2025-03-30 19:24:12
 * @Author: 李若愚
 * @LastEditors: 李若愚
 * @LastEditTime: 2025-03-31 02:37:03
 */
import erc20Abi from "@/abis/farm/erc20Abi";
import { useImage } from "@/helpers/useImage";
import FlexiFusionLiquidityModule from "@/abis/flexiFusionAbi/FlexiFusionLiquidityModule";
import type { PoolConfig, AdditionalPoolConfig } from "@/configs/pools/types";

const bscTestnetPools: Array<PoolConfig | AdditionalPoolConfig> = [
  {
    id: "0x2d81BaaBF0aC77C42bf1fB77943526ece1aEAa02",
    chainId: 97,
    name: "Stable / WETH",
    icon: useImage(`assets/images/tokens/Stable-WETH.png`),
    decimals: 18,
    contract: {
      address: "0x2d81BaaBF0aC77C42bf1fB77943526ece1aEAa02",
      abi: FlexiFusionLiquidityModule as const,
    },
    baseToken: {
      name: "Stable",
      icon: useImage(`assets/images/tokens/Stable.png`),
      decimals: 18,
      contract: {
        address: "0x1d81BaaBF0aC77C42bf1fB77943526ece1aEAa01",
        abi: erc20Abi as const,
      },
      isPopular: true,
    },
    quoteToken: {
      name: "Wrapped Ether",
      icon: useImage(`assets/images/tokens/WETH.png`),
      contract: {
        address: "0xafa8399499B2EE41A04eD98C59Db1e0E65cB73C1",
        abi: erc20Abi as const,
      },
      decimals: 18,
      isPopular: true,
    },
    settings: {
      isNew: true,
      isDeprecated: false,
      isMim: false,
      isPointsLogic: true,
      isLockAsStake: true,
      isDeprecatedFarm: false,
    },
    initialParameters: {
      I: 1000000000000000000n,
      K: 250000000000000n,
      lpFeeRate: 500000000000000n,
    },
  },
];

export default bscTestnetPools; 