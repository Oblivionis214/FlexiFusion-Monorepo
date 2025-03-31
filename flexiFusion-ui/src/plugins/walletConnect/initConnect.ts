import {
  commitWalletData,
  checkUnSupportedChain,
  checkSanctionAddress,
} from "@/plugins/walletConnect/utils";
import { markRaw } from "vue";
import { getAccount } from "@wagmi/core";
import type { Config } from "@wagmi/core";
import { watchAccount, watchChainId } from "@wagmi/core";
import { getEthersProvider } from "@/helpers/chains/getChainsInfo";
import store from "@/store";
import type { Store } from 'vuex';
import type { State } from '@/store';

declare const typedStore: Store<State>;
const vuexStore: typeof typedStore = store;

export const initWalletConect = async (wagmiConfig: Config) => {
  console.log("Initializing wallet connect with config:", wagmiConfig ? 'exists' : 'missing');
  const account = getAccount(wagmiConfig);
  console.log("Initial account state:", {
    address: account.address,
    chainId: account.chainId,
    isConnected: account.isConnected,
    isConnecting: account.isConnecting,
    isDisconnected: account.isDisconnected,
    status: account.status
  });

  // 设置初始检查状态
  vuexStore.commit("setIsWalletCheckInProcess", true);

  try {
    // 检查是否已经连接
    if (account.isConnected && account.address) {
      console.log("Account already connected, initializing with connect");
      await initConnect(wagmiConfig);
    } else {
      console.log("No connected account, initializing without connect");
      await initWithoutConnect(wagmiConfig);
    }

    // 设置账户变化监听
    watchAccount(wagmiConfig, {
      async onChange(account) {
        console.log("Account changed:", {
          address: account.address,
          chainId: account.chainId,
          isConnected: account.isConnected,
          isConnecting: account.isConnecting,
          isDisconnected: account.isDisconnected,
          status: account.status
        });
        
        vuexStore.commit("setIsWalletCheckInProcess", true);

        try {
          if (!account.isConnected && !account.isConnecting) {
            console.log("Account disconnected, initializing without connect");
            await initWithoutConnect(wagmiConfig);
          }

          if (account.isConnected && !account.isConnecting && account.address) {
            console.log("Account connected, initializing with connect");
            await initConnect(wagmiConfig);
          }
        } catch (error) {
          console.error("Error handling account change:", error);
        } finally {
          vuexStore.commit("setIsWalletCheckInProcess", false);
        }
      },
    });
  } catch (error) {
    console.error("Error in initWalletConect:", error);
  } finally {
    vuexStore.commit("setIsWalletCheckInProcess", false);
  }
};

const initConnect = async (wagmiConfig: Config) => {
  try {
    console.log("Initializing with connect...");
    const { address, chainId } = getAccount(wagmiConfig);
    console.log("Account info:", { address, chainId });
    
    if (!address || !chainId) {
      console.error("Missing address or chainId");
      return false;
    }

    const { unsupportedChain } = checkUnSupportedChain(chainId);
    console.log("Chain support check:", { chainId, unsupportedChain });

    if (await checkSanctionAddress(address)) {
      console.warn("Address is sanctioned");
      return false;
    }

    const provider = markRaw(getEthersProvider(chainId));
    console.log("Provider created:", provider ? 'success' : 'failed');

    await commitWalletData(chainId, provider, address, null, true, wagmiConfig);
    console.log("Wallet data committed to store");

    watchChainId(wagmiConfig, {
      onChange(id) {
        if (typeof id === 'number') {
          console.log("Chain ID changed:", id);
          vuexStore.commit("setChainId", id);
        } else {
          console.warn("Invalid chain ID:", id);
        }
      },
    });

    return true;
  } catch (error) {
    console.error("Error initializing wallet connect:", error);
    return false;
  }
};

export const initWithoutConnect = async (wagmiConfig: Config) => {
  try {
    console.log("Initializing without connect...");
    const { chainId } = getAccount(wagmiConfig);
    console.log("Chain ID from account:", chainId);
    
    if (!chainId) {
      console.warn("No chain ID available");
      return false;
    }
    
    const provider = markRaw(getEthersProvider(chainId));
    console.log("Provider created:", provider ? 'success' : 'failed');

    await commitWalletData(chainId, provider, null, null, false, wagmiConfig);
    console.log("Empty wallet data committed to store");

    watchChainId(wagmiConfig, {
      onChange(id) {
        if (typeof id === 'number') {
          console.log("Chain ID changed:", id);
          vuexStore.commit("setChainId", id);
        } else {
          console.warn("Invalid chain ID:", id);
        }
      },
    });

    return true;
  } catch (error) {
    console.error("Error initializing without wallet connect:", error);
    return false;
  }
};
