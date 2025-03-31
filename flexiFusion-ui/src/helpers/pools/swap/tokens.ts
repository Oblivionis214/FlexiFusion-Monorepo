import { getPublicClient } from "@/helpers/chains/getChainsInfo";
import { getSwapRouterByChain } from "@/configs/pools/routers";
import type { Address } from "viem";
import type { PoolConfig, TokenConfig } from "@/configs/pools/types";
import { tokenConfigs } from "@/configs/pools/tokenConfigs";
import { formatUnits } from "viem";

export type TokenInfo = {
  config: TokenConfig;
  userInfo: {
    allowance: bigint;
    balance: bigint;
  };
  price: number;
};

export type PriceInfo = {
  address: Address;
  price: number;
};

export type PairTokensInfo = {
  quoteToken: TokenInfo;
  baseToken: TokenInfo;
};

export const getTokenInfo = async (
  chainId: number,
  tokenConfig: TokenConfig,
  price: number,
  account?: Address
): Promise<TokenInfo> => {
  console.log("=== getTokenInfo Start ===");
  console.log("Input parameters:", {
    chainId,
    tokenName: tokenConfig.name,
    tokenAddress: tokenConfig.contract.address,
    price,
    account
  });

  const publicClient = getPublicClient(chainId);
  const swapRouter = getSwapRouterByChain(chainId);
  console.log("Using swap router:", swapRouter);

  const userInfo = {
    allowance: 0n,
    balance: 0n,
  };

  if (account) {
    try {
      console.log("Getting balance for account:", account);
      
      // 获取余额
      const balance = await publicClient.readContract({
        address: tokenConfig.contract.address,
        abi: tokenConfig.contract.abi,
        functionName: "balanceOf",
        args: [account],
      });
      console.log("Balance result:", {
        raw: balance?.toString(),
        formatted: formatUnits(balance as bigint, tokenConfig.decimals)
      });

      // 获取授权额度
      console.log("Getting allowance for router:", swapRouter);
      const allowance = await publicClient.readContract({
        address: tokenConfig.contract.address,
        abi: tokenConfig.contract.abi,
        functionName: "allowance",
        args: [account, swapRouter],
      });
      console.log("Allowance result:", {
        raw: allowance?.toString(),
        formatted: formatUnits(allowance as bigint, tokenConfig.decimals)
      });

      userInfo.balance = balance as bigint;
      userInfo.allowance = allowance as bigint;
    } catch (error) {
      console.error("Error getting balance/allowance:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack
        });
      }
    }
  } else {
    console.log("No account provided, returning zero balances");
  }

  const result = {
    config: tokenConfig,
    userInfo,
    price,
  };
  console.log("=== getTokenInfo Complete ===");
  console.log("Returning result:", {
    tokenName: result.config.name,
    tokenAddress: result.config.contract.address,
    balance: {
      raw: result.userInfo.balance.toString(),
      formatted: formatUnits(result.userInfo.balance, result.config.decimals)
    },
    allowance: {
      raw: result.userInfo.allowance.toString(),
      formatted: formatUnits(result.userInfo.allowance, result.config.decimals)
    },
    price: result.price
  });
  return result;
};

export const getPoolTokenInfo = async (
  chainId: number,
  poolConfig: PoolConfig,
  prices: PriceInfo[],
  account?: Address
): Promise<PairTokensInfo> => {
  const quoteTokenPrice =
    prices.find(
      (priceInfo) => priceInfo.address == poolConfig.quoteToken.contract.address
    )?.price || 0;

  const baseTokenPrice =
    prices.find(
      (priceInfo) => priceInfo.address == poolConfig.baseToken.contract.address
    )?.price || 0;

  const [quoteTokenInfo, baseTokenInfo] = await Promise.all([
    getTokenInfo(chainId, poolConfig.quoteToken, quoteTokenPrice, account),
    getTokenInfo(chainId, poolConfig.baseToken, baseTokenPrice, account),
  ]);

  return {
    quoteToken: quoteTokenInfo,
    baseToken: baseTokenInfo,
  };
};

// NOTICE: this function will be used to get token list on Swap page
export const getTokenListByPools = async (
  pools: Array<PoolConfig>,
  chainId: number,
  prices: PriceInfo[],
  account?: Address
): Promise<TokenInfo[]> => {
  console.log("getTokenListByPools - input:", {
    poolsCount: pools?.length,
    chainId,
    account,
    pricesCount: prices?.length
  });
  
  // 如果 pools 为空，使用配置的 token
  if (!pools || pools.length === 0) {
    console.log("getTokenListByPools - no pools, using configured tokens");
    const configuredTokens = tokenConfigs[chainId as keyof typeof tokenConfigs];
    if (!configuredTokens) {
      console.log("getTokenListByPools - no configured tokens for chain:", chainId);
      return [];
    }

    // 转换代币配置格式
    const tokens: TokenConfig[] = Object.values(configuredTokens).map(token => ({
      name: token.name,
      icon: token.icon,
      decimals: token.decimals,
      contract: {
        address: token.address as Address,
        abi: token.abi,
      },
    }));
    console.log("getTokenListByPools - configured tokens:", tokens);

    // 获取每个代币的信息
    const tokenInfoPromises = tokens.map(async (tokenConfig) => {
      const price =
        prices.find(
          (price) =>
            price.address.toLowerCase() ===
            tokenConfig.contract.address.toLowerCase()
        )?.price || 0;

      return getTokenInfo(chainId, tokenConfig, price, account);
    });

    const tokenInfos = await Promise.all(tokenInfoPromises);
    console.log("getTokenListByPools - token infos:", tokenInfos);
    return tokenInfos;
  }

  // 处理池子中的代币
  const uniqueTokens = getAllUniqueTokens(pools);
  console.log("getTokenListByPools - unique tokens from pools:", uniqueTokens);

  // 获取每个代币的信息
  const tokenInfoPromises = uniqueTokens.map(async (tokenConfig) => {
    const price =
      prices.find(
        (price) =>
          price.address.toLowerCase() ===
          tokenConfig.contract.address.toLowerCase()
      )?.price || 0;

    return getTokenInfo(chainId, tokenConfig, price, account);
  });

  const tokenInfos = await Promise.all(tokenInfoPromises);
  console.log("getTokenListByPools - final token infos:", tokenInfos);
  return tokenInfos;
};

export const getAllUniqueTokens = (pools: Array<PoolConfig>) => {
  return pools.reduce((acc: TokenConfig[], pool) => {
    if (
      !acc.some(
        (tokenConfig) =>
          tokenConfig.contract.address === pool.baseToken.contract.address
      )
    ) {
      acc.push(pool.baseToken);
    }
    if (
      !acc.some(
        (tokenConfig) =>
          tokenConfig.contract.address === pool.quoteToken.contract.address
      )
    ) {
      acc.push(pool.quoteToken);
    }
    return acc;
  }, [] as TokenConfig[]);
};
