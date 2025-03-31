/*
 * @Description: 
 * @Date: 2025-03-18 01:34:11
 * @Author: 李若愚
 * @LastEditors: 李若愚
 * @LastEditTime: 2025-03-31 08:30:13
 */
import store from "@/store";
import {
  getAccount,
  switchChain,
  writeContract,
  getWalletClient,
  simulateContract,
  estimateFeesPerGas,
  waitForTransactionReceipt,
  signTypedData,
  signMessage,
} from "@wagmi/core";

export const getWalletClientHelper = async () => {
  try {
    return await getWalletClient(store.getters.getWagmiConfig);
  } catch (error) {
    return null;
  }
};

export const switchChainHelper = async (chainId: number) => {
  await switchChain(store.getters.getWagmiConfig, { chainId });
};

export const simulateContractHelper = async (txInfo: any) => {
  try {
    return await simulateContract(store.getters.getWagmiConfig, txInfo);
  } catch (error) {
    console.error("Simulate contract error:", error);
    throw error;
  }
};

export const writeContractHelper = async (request: any) => {
  try {
    return await writeContract(store.getters.getWagmiConfig, request);
  } catch (error) {
    console.error("Write contract error:", error);
    throw error;
  }
};

export const waitForTransactionReceiptHelper = async (hash: any) => {
  try {
    return await waitForTransactionReceipt(store.getters.getWagmiConfig, hash);
  } catch (error) {
    console.error("Wait for transaction receipt error:", error);
    throw error;
  }
};

export const getAccountHelper = () => {
  return getAccount(store.getters.getWagmiConfig);
};

export const estimateFeesPerGasHelper = async () => {
  return await estimateFeesPerGas(store.getters.getWagmiConfig);
};

export const signTypedDataHelper = async (typedData: any) => {
  return await signTypedData(store.getters.getWagmiConfig, typedData);
};

export const signMessageHelper = async (message: string) => {
  return await signMessage(store.getters.getWagmiConfig, { message });
};
