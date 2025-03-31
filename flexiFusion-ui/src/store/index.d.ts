import { Store } from 'vuex';
import { providers } from 'ethers';
import type { Config } from '@wagmi/core';
import type { Address } from 'viem';

interface State {
  chainId: number | null;
  account: Address | null;
  ensName: string | null;
  provider: providers.StaticJsonRpcProvider | null;
  isMetamaskActive: boolean;
  isCoinbase: boolean;
  isWalletConnected: boolean;
  isWalletCheckInProcess: boolean;
  wagmiConfig: Config | null;
}

interface Getters {
  getChainId: (state: State) => number | null;
  getAccount: (state: State) => Address | null;
  getEnsName: (state: State) => string | null;
  getProvider: (state: State) => providers.StaticJsonRpcProvider | null;
  getWagmiConfig: (state: State) => Config | null;
  getWalletIsConnected: (state: State) => boolean;
  getIsWalletCheckInProcess: (state: State) => boolean;
  getMetamaskActive: (state: State) => boolean;
}

interface Mutations {
  setChainId: (state: State, payload: number) => void;
  setProvider: (state: State, payload: providers.StaticJsonRpcProvider) => void;
  setAccount: (state: State, payload: Address | null) => void;
  setENSName: (state: State, payload: string | null) => void;
  setWalletConnection: (state: State, payload: boolean) => void;
  setWagmiConfig: (state: State, payload: Config) => void;
  setIsCoinbase: (state: State, payload: boolean) => void;
  setMetamaskActive: (state: State, payload: boolean) => void;
  setIsWalletCheckInProcess: (state: State, payload: boolean) => void;
}

declare const store: Store<State>;
export default store;

export {
  State,
  Getters,
  Mutations,
}; 