import type { ActionConfig } from "@/helpers/pools/swap/getSwapInfo";
import { validateConnection } from "@/helpers/validators/validateConnection";
import type { Address } from "viem";
const SUPPORTED_CHAINS = [97]; // BSC Testnet

export const validationActions = (
  actionConfig: ActionConfig,
  selectedNetwork: number,
  chainId: number,
  account: Address,
  isApproving: boolean
) => {
  const { fromToken, toToken, fromInputValue, toInputValue } = actionConfig;

  const connectedError = validateConnection(account);
  if (connectedError.btnText) return { ...connectedError, walletInfo: null };

  const chainError = validateChain(selectedNetwork, chainId);
  if (chainError.btnText) return { ...chainError, walletInfo: null };

  if (fromToken.config.name === "Select Token")
    return { btnText: "Select Token", isAllowed: false, walletInfo: null };

  if (toToken.config.name === "Select Token")
    return { btnText: "Select Token", isAllowed: false, walletInfo: null };

  if (!fromInputValue || !toInputValue)
    return { btnText: "Enter Amount", isAllowed: false, walletInfo: null };

  if (fromInputValue > fromToken.userInfo.balance)
    return {
      btnText: `Insufficient ${fromToken.config.name} Balance`,
      isAllowed: false,
      walletInfo: null
    };

  if (isApproving) return { btnText: "Approving...", isAllowed: false, walletInfo: null };

  if (fromInputValue > fromToken.userInfo.allowance)
    return {
      btnText: `Approve ${fromToken.config.name}`,
      isAllowed: true,
      method: "approvefromToken",
      walletInfo: null
    };

  return { 
    btnText: "Swap", 
    isAllowed: true, 
    method: "swap",
    walletInfo: {
      address: account,
      balance: fromToken.userInfo.balance,
      symbol: fromToken.config.name
    }
  };
};

const validateChain = (
  selectedNetwork: number,
  connectedChainId: number,
  btnText = "Switch to BSC Testnet"
) => {
  if (selectedNetwork !== connectedChainId)
    return {
      btnText,
      isAllowed: true,
      method: "switchNetwork",
    };

  return { btnText: "", isAllowed: true };
};
