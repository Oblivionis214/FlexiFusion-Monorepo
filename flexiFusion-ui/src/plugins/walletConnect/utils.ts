import store from "@/store";
import { markRaw } from "vue";
import { providers } from "ethers";
import type { Address } from "viem";
import type { Config } from "@wagmi/core";
import { defaultRpc } from "@/helpers/chains";
import { sanctionAbi } from "@/abis/sanctionAbi";
import { getWalletClient } from "@wagmi/core";
import { defaultWagmiConfig } from "@web3modal/wagmi/vue";
import { getChainsConfigs } from "@/helpers/getChainsConfigs";
import notification from "@/helpers/notification/notification";
import { getPublicClient } from "@/helpers/chains/getChainsInfo";
import { SANCTIONS_LIST_ADDRESS } from "@/constants/tokensAddress";

export const createWagmiConfig = (projectId: string): Config => {
  // 1. Define constants
  const { chains } = getChainsConfigs();

  // 2. Create wagmiConfig
  const metadata = {
    name: "Web3Modal",
    description: "Web3Modal Example",
    url: "https://app.abracadabra.money/#/", // origin your domain & subdomain
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
  };

  return defaultWagmiConfig({
    chains,
    projectId,
    metadata,
    // ...wagmiOptions // Optional - Override createConfig parameters
  });
};

export const checkUnSupportedChain = (chainId = 1) => {
  const unsupportedChain = !defaultRpc[chainId as keyof typeof defaultRpc];

  if (unsupportedChain) {
    localStorage.setItem("MAGIC_MONEY_CHAIN_ID", chainId.toString());
  }

  return { unsupportedChain };
};

export const checkSanctionAddress = async (address: Address) => {
  const publicClient = getPublicClient(1);

  const isSanctioned = await publicClient.readContract({
    address: SANCTIONS_LIST_ADDRESS,
    abi: sanctionAbi,
    functionName: "isSanctioned",
    args: [address],
  });

  if (isSanctioned) {
    await store.dispatch("notifications/new", notification.sanctionAddress);
  }

  return isSanctioned;
};

export const getJsonRpcSigner = async (
  unsupportedChain: boolean,
  staticJsonRpcProvider: providers.StaticJsonRpcProvider,
  wagmiConfig: Config
) => {
  if (unsupportedChain) return staticJsonRpcProvider;

  const walletClient = await getWalletClient(wagmiConfig);

  if (!walletClient) return undefined;

  const { account, chain, transport } = walletClient;

  const network = {
    chainId: chain?.id || 1,
    name: chain?.name ?? "Ethereum",
    ensAddress: chain?.contracts?.ensRegistry?.address ?? "",
  };

  const provider = new providers.Web3Provider(transport, network);
  return markRaw(provider.getSigner(account?.address ?? ""));
};

export const commitWalletData = async (
  chainId: number,
  provider: providers.StaticJsonRpcProvider,
  address: Address | null,
  ensName: string | null,
  setWalletConnection: boolean,
  wagmiConfig: Config
) => {
  try {
    console.log("Committing wallet data:", {
      chainId,
      provider: provider ? 'exists' : 'missing',
      address,
      ensName,
      setWalletConnection,
      wagmiConfig: wagmiConfig ? 'exists' : 'missing'
    });

    store.commit("setChainId", chainId);
    store.commit("setProvider", provider);
    store.commit("setAccount", address);
    store.commit("setENSName", ensName);
    store.commit("setWalletConnection", setWalletConnection);
    store.commit("setWagmiConfig", wagmiConfig);

    console.log("Wallet data committed successfully");
    
    // 验证提交的数据
    const storeState = {
      chainId: store.getters.getChainId,
      account: store.getters.getAccount,
      ensName: store.getters.getEnsName,
      isWalletConnected: store.getters.getWalletIsConnected,
      provider: store.getters.getProvider ? 'exists' : 'missing',
      wagmiConfig: store.getters.getWagmiConfig ? 'exists' : 'missing'
    };
    
    console.log("Store state after commit:", storeState);
    
    // 验证数据一致性
    const isConsistent = 
      storeState.chainId === chainId &&
      storeState.account === address &&
      storeState.ensName === ensName &&
      storeState.isWalletConnected === setWalletConnection;
    
    if (!isConsistent) {
      console.warn("Store state inconsistency detected:", {
        expected: {
          chainId,
          address,
          ensName,
          setWalletConnection
        },
        actual: storeState
      });
    }

    return isConsistent;
  } catch (error) {
    console.error("Error committing wallet data:", error);
    throw error;
  }
};
