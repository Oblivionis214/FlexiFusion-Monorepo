import moment from "moment";
import type { Address } from "viem";
import type { TokenInfo } from "@/helpers/pools/swap/tokens";
import type { MagicLPInfo } from "@/helpers/pools/swap/types";
import { getSwapRouterByChain } from "@/configs/pools/routers";
import { applySlippageToMinOutBigInt } from "@/helpers/gm/applySlippageToMinOut";
import { querySellBase, querySellQuote } from "@/helpers/pools/swap/magicLp";

export type ActionConfig = {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromInputValue: bigint;
  toInputValue: bigint;
  slippage: bigint;
  deadline: bigint;
  fromInputAmount?: string;
};

export type RouteInfo = {
  inputToken: string;
  outputToken: Address;
  inputAmount: bigint;
  outputAmount: bigint;
  outputAmountWithoutFee: bigint;
  mtFee: bigint;
  lpFee: bigint;
  fees: bigint;
  lpInfo: MagicLPInfo;
  fromBase: boolean;
};

export const getSwapInfo = async (
  pools: MagicLPInfo[],
  actionConfig: ActionConfig,
  chainId: number,
  account: Address
) => {
  if (!pools || !pools.length) return getSwapInfoEmptyState(actionConfig);

  const { fromToken, toToken, fromInputValue } = actionConfig;
  
  try {
    // Find direct pool for the token pair
    const pool = pools.find(p => {
      // Type guard to ensure pool has the required properties
      if (!p?.baseToken || !p?.quoteToken || 
          typeof p.baseToken !== 'string' || typeof p.quoteToken !== 'string') {
        console.warn('Invalid pool structure:', p);
        return false;
      }

      const fromTokenAddress = fromToken.config.contract.address.toLowerCase();
      const toTokenAddress = toToken.config.contract.address.toLowerCase();
      const baseTokenAddress = p.baseToken.toLowerCase();
      const quoteTokenAddress = p.quoteToken.toLowerCase();

      return (baseTokenAddress === fromTokenAddress && quoteTokenAddress === toTokenAddress) ||
             (baseTokenAddress === toTokenAddress && quoteTokenAddress === fromTokenAddress);
    });

    if (!pool) {
      console.log('No matching pool found for tokens:', {
        fromToken: fromToken.config.contract.address,
        toToken: toToken.config.contract.address
      });
      return getSwapInfoEmptyState(actionConfig);
    }

    const fromBase = pool.baseToken.toLowerCase() === fromToken.config.contract.address.toLowerCase();
    
    // Get output amount
    const result = fromBase ? 
      querySellBase(fromInputValue, pool, pool.userInfo) :
      querySellQuote(fromInputValue, pool, pool.userInfo);

    // Handle the result based on the direction of the swap
    let outputAmount: bigint;
    if (fromBase && 'receiveQuoteAmount' in result) {
      outputAmount = result.receiveQuoteAmount;
    } else if (!fromBase && 'receiveBaseAmount' in result) {
      outputAmount = result.receiveBaseAmount;
    } else {
      outputAmount = 0n;
    }

    const mtFee = result.mtFee;
    const lpFee = result.feeAmount;

    const route: RouteInfo = {
      inputToken: fromToken.config.contract.address,
      outputToken: toToken.config.contract.address as Address,
      inputAmount: fromInputValue,
      outputAmount,
      outputAmountWithoutFee: outputAmount + mtFee + lpFee,
      mtFee,
      lpFee,
      fees: mtFee + lpFee,
      lpInfo: pool,
      fromBase
    };

    const outputAmountWithSlippage = applySlippageToMinOutBigInt(
      actionConfig.slippage,
      outputAmount
    );

    const transactionInfo = getTransactionInfo(
      [route],
      actionConfig,
      chainId,
      account
    );

    return {
      routes: [route],
      actionConfig,
      inputAmount: fromInputValue,
      outputAmount,
      outputAmountWithSlippage,
      transactionInfo,
    };
  } catch (error) {
    console.error('Error in getSwapInfo:', error);
    return getSwapInfoEmptyState(actionConfig);
  }
};

export const getSwapInfoEmptyState = (actionConfig: ActionConfig) => {
  const { fromInputValue } = actionConfig;

  return {
    routes: [],
    actionConfig,
    outputAmount: fromInputValue,
    outputAmountWithSlippage: fromInputValue,
    transactionInfo: {
      methodName: "",
      payload: {},
      swapRouterAddress: "",
    },
  };
};

const getTransactionInfo = (
  routes: RouteInfo[],
  actionConfig: ActionConfig,
  chainId: number,
  account: Address
) => {
  const route = routes[0];
  const methodName = route.fromBase ? "sellBaseTokensForTokens" : "sellQuoteTokensForTokens";
  const payload = getPayloadByMethod(methodName, route, actionConfig, account);
  const swapRouterAddress: Address = getSwapRouterByChain(chainId);

  return {
    methodName,
    payload,
    swapRouterAddress,
  };
};

const getPayloadByMethod = (
  methodName: string,
  route: RouteInfo,
  actionConfig: ActionConfig,
  account: Address
) => {
  const { lpInfo, inputAmount, outputAmount } = route;
  const deadline = moment().unix() + Number(actionConfig.deadline);
  const outputAmountWithSlippage = applySlippageToMinOutBigInt(
    actionConfig.slippage,
    outputAmount
  );

  return {
    lp: lpInfo.contract.address,
    to: account,
    amountIn: inputAmount,
    minimumOut: outputAmountWithSlippage,
    deadline,
  };
};
