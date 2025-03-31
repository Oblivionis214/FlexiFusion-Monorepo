import { reconnect } from "@wagmi/core";
import { createWeb3Modal } from "@web3modal/wagmi/vue";
import { createWagmiConfig } from "@/plugins/walletConnect/utils";

const projectId = import.meta.env.VITE_APP_CONNECT_KEY;

export const initWeb3Modal = async () => {
  try {
    console.log("Starting Web3Modal initialization...");
    
    if (!projectId) {
      console.error("Project ID is missing");
      throw new Error("Project ID is required for Web3Modal initialization");
    }

    console.log("Creating Wagmi config...");
    const wagmiConfig = createWagmiConfig(projectId);
    
    if (!wagmiConfig) {
      console.error("Failed to create Wagmi config");
      throw new Error("Wagmi config creation failed");
    }
    
    console.log("Attempting to reconnect...");
    try {
      await reconnect(wagmiConfig);
      console.log("Reconnect successful");
    } catch (reconnectError) {
      console.warn("Reconnect failed, but continuing:", reconnectError);
    }

    console.log("Creating Web3Modal instance...");
    const web3modal = await createWeb3Modal({
      wagmiConfig: wagmiConfig,
      projectId,
      enableAnalytics: true,
      enableOnramp: true,
      themeMode: 'dark'
    });

    if (!web3modal) {
      console.error("Failed to create Web3Modal instance");
      throw new Error("Web3Modal creation failed");
    }

    console.log("Web3Modal initialization complete:", {
      web3modal: web3modal ? 'exists' : 'missing',
      wagmiConfig: wagmiConfig ? 'exists' : 'missing',
      ethereum: {
        exists: typeof window.ethereum !== 'undefined',
        isConnected: window.ethereum?.isConnected?.(),
        selectedAddress: window.ethereum?.selectedAddress,
        chainId: window.ethereum?.chainId
      }
    });

    return { web3modal, wagmiConfig };
  } catch (error) {
    console.error("Error in Web3Modal initialization:", error);
    throw error;
  }
};
