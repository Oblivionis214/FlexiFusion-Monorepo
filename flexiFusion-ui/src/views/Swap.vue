<!--
 * @Description: 
 * @Date: 2025-03-18 01:34:11
 * @Author: 李若愚
 * @LastEditors: 李若愚
 * @LastEditTime: 2025-03-31 11:02:09
-->
<template>
  <div class="swap-view">
    <div class="swap-wrapper">
      <div class="swap-head">
        <h3 class="title">
          Swap
          <AvailableNetworksBlock
            :selectedNetwork="selectedNetwork"
            :availableNetworks="availableNetworks"
            @changeNetwork="changeNetwork"
          />
        </h3>

        <SwapSettingsPopup
          :slippage="actionConfig.slippage"
          :defaultSlippage="20n"
          :deadline="actionConfig.deadline"
          @updateSlippageValue="updateSlippageValue"
          @updateDeadlineValue="updateDeadlineValue"
        />
      </div>

      <div class="swap-body">
        <div v-if="account && actionValidationData?.walletInfo" class="wallet-info">
          <div class="wallet-address">
            <span class="label">Wallet:</span>
            <span class="value">{{ formatAddress(actionValidationData.walletInfo.address) }}</span>
          </div>
          <div class="wallet-balance" v-if="actionValidationData.walletInfo.balance">
            <span class="label">Balance:</span>
            <span class="value">{{ formatUnits(actionValidationData.walletInfo.balance, actionConfig.fromToken.config.decimals) }} {{ actionValidationData.walletInfo.symbol }}</span>
          </div>
        </div>

        <SwapForm
          :fromTokenPrice="fromTokenPrice"
          :toTokenPrice="toTokenPrice"
          :fromToken="actionConfig.fromToken"
          :toToken="actionConfig.toToken"
          :toTokenAmount="actionConfig.toInputValue"
          :differencePrice="differencePrice"
          :isLoading="isLoading"
          @onToogleTokens="toogleTokens"
          @openTokensPopup="openTokensPopup"
          @updateFromInputValue="updateFromValue"
        />

        <div>
          <CurrentPrice
            :fromToken="actionConfig?.fromToken"
            :toToken="actionConfig?.toToken"
            :currentPriceInfo="currentPriceInfo"
            :isLoading="isLoading"
          />
        </div>

        <SwapInfoBlock
          :swapInfo="swapInfo"
          :actionConfig="actionConfig"
          :priceImpact="priceImpactPair"
          :selectedNetwork="selectedNetwork"
          :nativeTokenPrice="nativeTokenPrice"
          :isLoading="isLoading"
        />

        <BaseButton
          :primary="!isWarningBtn"
          :disabled="
            !actionValidationData.isAllowed || isFetchSwapInfo || isLoading
          "
          :warning="isWarningBtn"
          @click="actionHandler"
          :loading="isApproving"
          >{{ actionValidationData.btnText }}</BaseButton
        >
      </div>
    </div>

    <!-- Add Lend Section -->
    <div class="swap-wrapper">
      <div class="swap-head">
        <h3 class="title">
          Lend
          <AvailableNetworksBlock
            :selectedNetwork="selectedNetwork"
            :availableNetworks="availableNetworks"
            @changeNetwork="changeNetwork"
          />
        </h3>
      </div>

      <div class="swap-body">
        <SwapForm
          :fromTokenPrice="fromTokenPrice"
          :toTokenPrice="toTokenPrice"
          :fromToken="lendConfig.fromToken"
          :toToken="lendConfig.toToken"
          :toTokenAmount="lendConfig.toInputValue"
          :differencePrice="0"
          :isLoading="isLendLoading"
          :showSwapButton="false"
          :showEnterAmountButton="true"
          @openTokensPopup="openLendTokensPopup"
          @updateFromInputValue="updateLendFromValue"
          @updateToInputValue="updateLendToValue"
          @updateStableInputValue="updateLendStableValue"
          @updateWrappedInputValue="updateLendWrappedValue"
          @onEnterAmount="handleLendEnterAmount"
          @onWithdraw="handleLendWithdrawProcess"
          @onBorrow="handleLendBorrow"
          @onRepay="handleLendRepay"
        >
          <!-- Third Button -->
          <button class="enter-amount-button" @click="handleLendBorrow">
            Enter Amount
          </button>
        </SwapForm>
      </div>
    </div>

    <LocalPopupWrap
      isFarm
      :isOpened="isTokensPopupOpened"
      @closePopup="isTokensPopupOpened = false"
    >
      <SwapListPopup
        v-if="isTokensPopupOpened"
        :tokensList="filterTokensList"
        :tokenType="tokenType"
        :fromTokenAddress="isLendTokenSelection ? lendConfig.fromToken.config.contract.address : actionConfig.fromToken.config.contract.address"
        :toTokenAddress="isLendTokenSelection ? lendConfig.toToken.config.contract.address : actionConfig.toToken.config.contract.address"
        @updateSelectedToken="updateSelectedToken"
      />
    </LocalPopupWrap>

    <LocalPopupWrap
      isFarm
      :isOpened="isConfirmationPopupOpened"
      @closePopup="isConfirmationPopupOpened = false"
    >
      <ConfirmationPopup
        :actionConfig="actionConfig"
        :swapInfo="swapInfo"
        :priceImpact="priceImpactPair"
        :currentPriceInfo="currentPriceInfo"
        @confirm="closeConfirmationPopup"
      />
    </LocalPopupWrap>
  </div>
</template>

<script lang="ts">
import {
  BSC_TESTNET_CHAIN_ID,
} from "@/constants/global";
import {
  getSwapInfo,
  getSwapInfoEmptyState,
} from "@/helpers/pools/swap/getSwapInfo";
import {
  getCoinsPrices,
  getNativeTokensPrice,
} from "@/helpers/prices/defiLlama";
import { defineAsyncComponent, defineComponent } from "vue";
import type { ContractInfo } from "@/types/global";
import { approveTokenViem } from "@/helpers/approval";
import type { PoolConfig } from "@/configs/pools/types";
import { mapActions, mapGetters, mapMutations } from "vuex";
import { formatUnits, parseUnits, type Address } from "viem";
import type { TokenInfo } from "@/helpers/pools/swap/tokens";
import type { TokenPrice } from "@/helpers/prices/defiLlama";
import { switchNetwork } from "@/helpers/chains/switchNetwork";
import notification from "@/helpers/notification/notification";
import { getAllUniqueTokens } from "@/helpers/pools/swap/tokens";
import { getTokenListByPools } from "@/helpers/pools/swap/tokens";
import { getAllPoolsByChain } from "@/helpers/pools/swap/magicLp";
import type { ActionConfig, RouteInfo } from "@/helpers/pools/swap/getSwapInfo";
import { validationActions } from "@/helpers/validators/swap/validationActions";
import { getPoolConfigsByChains } from "@/helpers/pools/configs/getOrCreatePairsConfigs";
import { formatUSD } from "@/helpers/filters";
import store from '@/store';
import type { ComponentCustomProperties } from 'vue';
import { erc20Abi } from "viem";
import FlexiFusionLiquidityModule from "@/abis/flexiFusionAbi/FlexiFusionLiquidityModule";
import CPMMDEXModule from "@/abis/flexiFusionAbi/CPMMDEXModule";
import FlexiLendingModule from "@/abis/flexiFusionAbi/FlexiLendingModule";
import {
  writeContractHelper,
  simulateContractHelper,
} from "@/helpers/walletClienHelper";

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: typeof store;
    $openWeb3modal: () => Promise<void>;
  }
}

interface ExtendedError extends Error {
  code?: string | number;
}

interface EthereumProvider {
  isConnected?: () => boolean;
  providers?: any[];
  request?: (...args: any[]) => Promise<any>;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
  selectedAddress?: string;
  chainId?: string;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

interface ComponentInstance {
  $store: typeof store;
  checkWeb3ModalStatus: () => Promise<boolean>;
  initializeWeb3Modal: () => Promise<boolean>;
  $openWeb3modal: () => Promise<void>;
}

const emptyTokenInfo: TokenInfo = {
  config: {
    name: "Select Token",
    decimals: 18,
    icon: "",
    contract: { address: "0x", abi: "" },
  },
  price: 0,
  userInfo: {
    balance: 0n,
    allowance: 0n,
  },
};

export default defineComponent({
  name: 'Swap',
  data() {
    return {
      tokensList: [] as TokenInfo[],
      poolsList: [] as any,
      tokenType: "from",
      isLendTokenSelection: false,
      isTokensPopupOpened: false,
      isConfirmationPopupOpened: false,
      wethAddress: "0xafa8399499B2EE41A04eD98C59Db1e0E65cB73C1" as Address,
      stableAddress: "0x1d81BaaBF0aC77C42bf1fB77943526ece1aEAa01" as Address,
      prices: [] as TokenPrice[],
      actionConfig: {
        fromToken: emptyTokenInfo,
        toToken: emptyTokenInfo,
        fromInputValue: 0n,
        toInputValue: 0n,
        slippage: 20n,
        deadline: 500n,
        fromInputAmount: "0",
      } as ActionConfig,
      lendConfig: {
        fromToken: emptyTokenInfo,
        toToken: emptyTokenInfo,
        fromInputValue: 0n,
        toInputValue: 0n,
        fromInputAmount: "0",
        toInputAmount: "0",
        stableInputValue: 0n,
        stableInputAmount: "0",
        wrappedInputValue: 0n,
        wrappedInputAmount: "0"
      },
      lendValidationData: {
        isAllowed: false,
        method: "connectWallet",
        btnText: "Connect Wallet",
        walletInfo: null,
      },
      isLendApproving: false,
      isLendLoading: false,
      updateInterval: null as any,
      isFetchSwapInfo: false,
      swapInfo: getSwapInfoEmptyState({
        fromToken: emptyTokenInfo,
        toToken: emptyTokenInfo,
        fromInputValue: 0n,
        toInputValue: 0n,
        slippage: 20n,
        deadline: 500n,
      } as ActionConfig),
      selectedNetwork: BSC_TESTNET_CHAIN_ID,
      availableNetworks: [
        BSC_TESTNET_CHAIN_ID,
      ],
      isApproving: false,
      nativeTokenPrice: [] as { chainId: number; price: number }[],
      poolConfigs: [] as PoolConfig[],
      isLoading: false,
      walletStatus: {
        isConnecting: false,
        lastError: null as ExtendedError | null,
        connectionAttempts: 0,
        providerType: null as string | null
      },
      isManualTokenSwitch: false,
    };
  },

  computed: {
    ...mapGetters({ chainId: "getChainId", account: "getAccount" }),

    isWarningBtn() {
      if (!this.priceImpactPair) return false;
      return +this.priceImpactPair <= -15;
    },

    actionValidationData() {
      const validationResult = validationActions(
        this.actionConfig,
        this.selectedNetwork,
        this.chainId,
        this.account,
        this.isApproving
      );

      if (validationResult.walletInfo && this.actionConfig.fromToken.userInfo) {
        validationResult.walletInfo.balance = this.actionConfig.fromToken.userInfo.balance;
      }

      return validationResult;
    },

    feePayload(): Array<string | bigint | number> {
      const { payload }: any = this.swapInfo.transactionInfo;
      if (!Object.keys(payload).length) return [];
      return Object.values(payload);
    },

    fromTokenPrice() {
      const { fromToken } = this.actionConfig;

      return (
        this.prices.find(
          (price) => price.address === fromToken?.config.contract.address
        )?.price || 0
      );
    },

    toTokenPrice() {
      const { toToken } = this.actionConfig;

      return (
        this.prices.find(
          (price) => price.address === toToken?.config.contract.address
        )?.price || 0
      );
    },

    currentPriceInfo() {
      const amounts = {
        from: this.actionConfig.fromInputValue,
        to: this.actionConfig.toInputValue,
      };

      const routeInfo: RouteInfo =
        this.swapInfo.routes[this.swapInfo.routes.length - 1];

      if (!routeInfo) {
        return {
          midPrice: 0,
          amounts: amounts,
          fromBase: false,
        };
      }

      const midPrice = routeInfo.lpInfo.midPrice;
      const fromBase = routeInfo.lpInfo.baseToken === routeInfo.inputToken;

      return {
        midPrice,
        amounts,
        fromBase,
      };
    },

    // Alternative price impact calculation
    priceImpactPair(): string | number {
      const routeInfo: RouteInfo =
        this.swapInfo.routes[this.swapInfo.routes.length - 1];

      if (!routeInfo) return 0;

      const isBase = routeInfo.lpInfo.baseToken === routeInfo.inputToken;

      //@ts-ignore
      const { midPrice } = routeInfo.lpInfo;

      //@ts-ignore
      const tokenAmountIn = this.swapInfo.inputAmount;
      const tokenAmountOut = routeInfo.outputAmountWithoutFee;
      if (!tokenAmountIn || !tokenAmountOut) return 0;

      const parsedAmountIn = formatUnits(
        tokenAmountIn,
        this.actionConfig.fromToken.config.decimals
      );

      const parsedAmountOut = formatUnits(
        tokenAmountOut,
        this.actionConfig.toToken.config.decimals
      );

      const executionPrice = isBase
        ? Number(parsedAmountOut) / Number(parsedAmountIn)
        : Number(parsedAmountIn) / Number(parsedAmountOut);

      const priceImpact =
        Math.abs(midPrice - executionPrice) / Number(midPrice);

      return Number(priceImpact * 100).toFixed(2);
    },

    differencePrice() {
      const { fromToken, toToken, fromInputValue, toInputValue }: any =
        this.actionConfig;

      if (!fromInputValue || !toInputValue) return 0;

      const fromTokenAmountUsd =
        this.fromTokenPrice *
        +formatUnits(fromInputValue, fromToken?.config.decimals || 18);

      const toTokenAmountUsd =
        this.toTokenPrice *
        +formatUnits(toInputValue || 0n, toToken?.config.decimals || 18);

      const differencePrice = toTokenAmountUsd / fromTokenAmountUsd;

      if (!differencePrice) return differencePrice;
      return (differencePrice - 1) * 100;
    },

    isMIMToken() {
      return (
        (this.tokenType === "from" &&
          this.actionConfig.fromToken.config.name === "MIM") ||
        (this.tokenType === "to" &&
          this.actionConfig.toToken.config.name === "MIM")
      );
    },

    filterTokensList() {
      return this.tokensList;
    },
  },

  watch: {
    chainId() {
      if (this.account) {
        this.createSwapInfo();
      }
    },

    async selectedNetwork() {
      if (!this.account) return;
      
      this.isLoading = true;
      this.resetActionCaonfig();
      await this.createSwapInfo();
      this.isLoading = false;
    },

    account: {
      immediate: true,
      async handler(newAccount: string | null, oldAccount: string | null) {
        console.log("Account watcher triggered:", {
          newAccount,
          oldAccount,
          storeAccount: this.$store.getters.getAccount,
          isWalletConnected: this.$store.getters.getWalletIsConnected,
          ethereum: {
            selectedAddress: window.ethereum?.selectedAddress,
            isConnected: window.ethereum?.isConnected?.()
          }
        });

        if (newAccount) {
          console.log("Account connected, initializing...");
          this.isLoading = true;
          
          console.log("Getting pool configs for connected wallet...");
          this.poolConfigs = await getPoolConfigsByChains();
          console.log("Pool configs received:", {
            count: this.poolConfigs?.length || 0,
            configs: this.poolConfigs
          });
          
          console.log("Getting native token prices...");
          this.nativeTokenPrice = await getNativeTokensPrice(this.availableNetworks);
          console.log("Native token prices received:", this.nativeTokenPrice);
          
          console.log("Checking and setting chain...");
          this.checkAndSetSelectedChain();
          console.log("Chain set to:", this.selectedNetwork);
          
          console.log("Creating swap info for connected wallet...");
          await this.createSwapInfo();
          
          if (!oldAccount) {
            console.log("Initial account connection, selecting base tokens...");
            this.selectBaseTokens();
          }
          
          this.isLoading = false;
          console.log("Wallet initialization complete");

          // 更新 lendValidationData
          this.lendValidationData = {
            isAllowed: true,
            method: "lend",
            btnText: "Enter Amount",
            walletInfo: {
              address: newAccount,
              balance: 0n,
              symbol: "",
            },
          };
        } else {
          console.log("Account disconnected, resetting state...");
          this.resetActionCaonfig();
          this.tokensList = [];
          this.poolsList = [];
          console.log("State reset complete");

          // 重置 lendValidationData
          this.lendValidationData = {
            isAllowed: false,
            method: "connectWallet",
            btnText: "Connect Wallet",
            walletInfo: null,
          };
        }
      }
    },

    actionConfig: {
      async handler(value: ActionConfig) {
        if (this.isFetchSwapInfo) return;

        const actionConfig = value;

        const { decimals } = this.actionConfig.fromToken.config;
        const { fromInputAmount } = this.actionConfig;
        const amount = parseUnits(fromInputAmount || "0", decimals);

        actionConfig.fromInputValue = amount;

        //@ts-ignore
        this.swapInfo = await getSwapInfo(
          this.poolsList,
          actionConfig,
          this.selectedNetwork,
          this.account
        );

        this.actionConfig.toInputValue = this.swapInfo.outputAmount;
      },
      deep: true,
    },

    "actionConfig.fromToken": {
      async handler(newToken, oldToken) {
        if (this.isManualTokenSwitch || this.isFetchSwapInfo) {
          return;
        }

        console.log("fromToken watcher triggered:", {
          newToken: newToken.config.name,
          oldToken: oldToken?.config.name,
          isManualSwitch: this.isManualTokenSwitch,
          isFetchSwapInfo: this.isFetchSwapInfo
        });

        // @ts-ignore
        this.swapInfo = await getSwapInfo(
          this.poolsList,
          this.actionConfig,
          this.selectedNetwork,
          this.account
        );

        this.actionConfig.toInputValue = this.swapInfo.outputAmount;
      },
      deep: true,
    },

    "actionConfig.toToken": {
      async handler(newToken, oldToken) {
        if (this.isManualTokenSwitch || this.isFetchSwapInfo) {
          return;
        }

        console.log("toToken watcher triggered:", {
          newToken: newToken.config.name,
          oldToken: oldToken?.config.name,
          isManualSwitch: this.isManualTokenSwitch,
          isFetchSwapInfo: this.isFetchSwapInfo
        });

        // @ts-ignore
        this.swapInfo = await getSwapInfo(
          this.poolsList,
          this.actionConfig,
          this.selectedNetwork,
          this.account
        );

        this.actionConfig.toInputValue = this.swapInfo.outputAmount;
      },
      deep: true,
    },
  },

  methods: {
    ...mapActions({ createNotification: "notifications/new" }),
    ...mapMutations({ deleteNotification: "notifications/delete" }),
    formatUSD,

    successNotification(notificationId: number) {
      this.deleteNotification(notificationId);
      this.createNotification(notification.success);
    },

    updateFromValue(value: bigint, fromInputAmount: string) {
      this.actionConfig.fromInputAmount = fromInputAmount;

      if (value === null) {
        this.actionConfig.fromInputValue = 0n;
        this.actionConfig.toInputValue = 0n;
      } else {
        this.actionConfig.fromInputValue = value;
        this.actionConfig.toInputValue = this.swapInfo.outputAmount;
      }
    },

    updateSelectedToken(token: TokenInfo) {
      if (this.isLendTokenSelection) {
        // Lend 部分的 token 选择逻辑
        if (this.tokenType === "to") {
          if (this.lendConfig.fromToken.config.name === token.config.name) {
            this.lendConfig.fromToken = this.lendConfig.toToken;
            this.lendConfig.toToken = token;
          } else {
            this.lendConfig.toToken = token;
          }
        }
        if (this.tokenType === "from") {
          if (this.lendConfig.toToken.config.name === token.config.name) {
            this.lendConfig.toToken = this.lendConfig.fromToken;
            this.lendConfig.fromToken = token;
          } else {
            this.lendConfig.fromToken = token;
          }
        }
      } else {
        // Swap 部分的原有逻辑
        console.log("Updating selected token:", {
          tokenType: this.tokenType,
          newToken: token.config.name,
          currentFromToken: this.actionConfig.fromToken.config.name,
          currentToToken: this.actionConfig.toToken.config.name
        });

        this.isManualTokenSwitch = true;
        this.isFetchSwapInfo = true;

        if (this.tokenType === "to") {
          if (this.actionConfig.fromToken.config.name === token.config.name) {
            this.actionConfig.fromToken = this.actionConfig.toToken;
            this.actionConfig.toToken = token;
          } else {
            this.actionConfig.toToken = token;
          }
        }

        if (this.tokenType === "from") {
          if (this.actionConfig.toToken.config.name === token.config.name) {
            this.actionConfig.toToken = this.actionConfig.fromToken;
            this.actionConfig.fromToken = token;
          } else {
            this.actionConfig.fromToken = token;
          }
        }

        this.updateFromValue(
          this.actionConfig.fromInputValue,
          this.actionConfig.fromInputAmount || "0"
        );

        this.isTokensPopupOpened = false;

        setTimeout(() => {
          this.isManualTokenSwitch = false;
          this.isFetchSwapInfo = false;
          
          this.createSwapInfo();
        }, 1000);
      }

      this.isTokensPopupOpened = false;
    },

    updateSlippageValue(value: bigint) {
      this.actionConfig.slippage = value;
    },

    updateDeadlineValue(value: bigint) {
      this.actionConfig.deadline = value;
    },

    resetActionCaonfig() {
      this.actionConfig.fromInputValue = 0n;
      this.actionConfig.toInputValue = 0n;
      this.actionConfig.slippage = 20n;
      this.actionConfig.deadline = 500n;
      this.actionConfig.fromInputAmount = "";
    },

    openTokensPopup(type: string) {
      this.tokenType = type;
      this.isLendTokenSelection = false;
      this.isTokensPopupOpened = true;
    },

    openConfirmationPopup() {
      this.isConfirmationPopupOpened = true;
    },

    closeConfirmationPopup() {
      this.actionConfig.fromInputValue = 0n;
      this.actionConfig.toInputValue = 0n;
      this.isConfirmationPopupOpened = false;
    },

    async toogleTokens() {
      try {
        console.log("Toggling tokens:", {
          fromToken: {
            name: this.actionConfig.fromToken.config.name,
            address: this.actionConfig.fromToken.config.contract.address
          },
          toToken: {
            name: this.actionConfig.toToken.config.name,
            address: this.actionConfig.toToken.config.contract.address
          }
        });

        this.isManualTokenSwitch = true;
        this.isFetchSwapInfo = true;

        // 交换代币
        const tempFromToken = { ...this.actionConfig.fromToken };
        this.actionConfig.fromToken = { ...this.actionConfig.toToken };
        this.actionConfig.toToken = tempFromToken;
        
        // 更新输入值
        this.updateFromValue(
          this.actionConfig.fromInputValue,
          this.actionConfig.fromInputAmount || "0"
        );

        // 立即更新代币信息
        await this.updateTokenBalances();

        console.log("Tokens after toggle:", {
          fromToken: {
            name: this.actionConfig.fromToken.config.name,
            address: this.actionConfig.fromToken.config.contract.address
          },
          toToken: {
            name: this.actionConfig.toToken.config.name,
            address: this.actionConfig.toToken.config.contract.address
          }
        });

        // 延迟重置标志并更新 swap info
        setTimeout(async () => {
          this.isManualTokenSwitch = false;
          this.isFetchSwapInfo = false;
          await this.createSwapInfo();
        }, 1000);
      } catch (error) {
        console.error("Error in toogleTokens:", error);
        this.isManualTokenSwitch = false;
        this.isFetchSwapInfo = false;
      }
    },

    async updateTokenBalances() {
      try {
        console.log("=== Token Balance Update Start ===");
        
        // 获取最新的代币列表
        const poolConfigs = await getPoolConfigsByChains() || [];
        const filteredPools = poolConfigs.filter(pool => 
          pool.chainId === this.selectedNetwork
        );
        
        // 获取最新的价格
        const prices = await this.getTokensPrices(filteredPools);
        
        // 获取更新后的代币列表
        console.log("Fetching token balances for account:", this.account);
        const updatedTokensList = await getTokenListByPools(
          filteredPools,
          this.selectedNetwork,
          prices || [],
          this.account as Address
        ) || [];

        // 更新当前选中代币的余额信息
        const updatedFromToken = updatedTokensList.find(
          token => token.config.contract.address.toLowerCase() === 
                   this.actionConfig.fromToken.config.contract.address.toLowerCase()
        );
        
        const updatedToToken = updatedTokensList.find(
          token => token.config.contract.address.toLowerCase() === 
                   this.actionConfig.toToken.config.contract.address.toLowerCase()
        );

        if (updatedFromToken) {
          this.actionConfig.fromToken.userInfo = updatedFromToken.userInfo;
          this.actionConfig.fromToken.price = updatedFromToken.price;
        }

        if (updatedToToken) {
          this.actionConfig.toToken.userInfo = updatedToToken.userInfo;
          this.actionConfig.toToken.price = updatedToToken.price;
        }

        console.log("=== Token Balance Update Complete ===");

      } catch (error) {
        console.error("Error updating token balances:", error);
        if (error instanceof Error) {
          console.error("Error details:", {
            message: error.message,
            stack: error.stack
          });
        }
      }
    },

    async getTokensPrices(poolsConfig: PoolConfig[]) {
      const uniqueTokens = getAllUniqueTokens(poolsConfig);
      const coins = uniqueTokens.map(({ contract }) => contract.address);
      coins.push(this.wethAddress);
      return await getCoinsPrices(this.selectedNetwork, coins);
    },

    async approveTokenHandler(contract: ContractInfo, valueToApprove: bigint) {
      let notificationId;
      try {
        // 检查钱包连接状态
        if (!this.account || !this.$store.getters.getWalletIsConnected) {
          await this.createNotification({
            type: "error",
            title: "Error",
            message: "Please connect your wallet first"
          });
          return false;
        }

        // 检查网络状态
        if (this.chainId !== this.selectedNetwork) {
          await this.createNotification({
            type: "error",
            title: "Error",
            message: "Please switch to the correct network"
          });
          return false;
        }

        // 获取 wagmiConfig
        const wagmiConfig = this.$store.getters.getWagmiConfig;
        if (!wagmiConfig) {
          // 如果没有配置，尝试重新初始化
          const { initWeb3Modal } = await import("@/plugins/walletConnect/initWeb3Modal");
          const { wagmiConfig: newConfig } = await initWeb3Modal();
          if (!newConfig) {
            throw new Error("Failed to initialize wallet configuration");
          }
          // 更新 store 中的配置
          await this.$store.commit('setWagmiConfig', newConfig);
        }

        this.isApproving = true;
        
        // 显示等待交易确认的提示
        notificationId = await this.createNotification({
          type: "pending",
          title: "Pending",
          message: "Approve in progress"
        });

        // 使用固定的 ERC20 合约
        const erc20Contract = {
          address: contract.address,
          abi: erc20Abi,
        };

        // 1. 执行 approve 操作
        const approveHash = await approveTokenViem(
          erc20Contract,
          "0xDEDbDf2f3EE1CB459F2eB0f9A4972A5588158a2D" as Address,
          valueToApprove,
          this.$store.getters.getWagmiConfig
        );

        if (!approveHash) {
          throw new Error("Approve transaction failed");
        }

        // 等待 approve 交易完成
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 删除 approve 等待提示
        if (notificationId) {
          await this.deleteNotification(notificationId);
        }

        // 显示 approve 成功提示
        await this.createNotification({
          type: "success",
          title: "Success",
          message: "Token approved successfully"
        });

        // 2. 执行 deposit 操作
        notificationId = await this.createNotification({
          type: "pending",
          title: "Pending",
          message: "Deposit in progress"
        });

        // 使用 FlexiFusionLiquidityModule 合约
        const liquidityContract = {
          address: "0xDEDbDf2f3EE1CB459F2eB0f9A4972A5588158a2D" as Address,
          abi: FlexiFusionLiquidityModule,
        };

        // 调用 deposit 方法
        const { request } = await simulateContractHelper({
          address: liquidityContract.address,
          abi: liquidityContract.abi,
          functionName: "deposit",
          args: [
            this.account as Address,
            // 如果 fromToken 是 Stable，则 token0Amt 为输入值，token1Amt 为 0
            // 如果 fromToken 是 WETH，则 token0Amt 为 0，token1Amt 为输入值
            this.actionConfig.fromToken.config.contract.address.toLowerCase() === this.stableAddress.toLowerCase() 
              ? this.actionConfig.fromInputValue 
              : 0n,
            this.actionConfig.fromToken.config.contract.address.toLowerCase() === this.wethAddress.toLowerCase() 
              ? this.actionConfig.fromInputValue 
              : 0n
          ],
          wagmiConfig: this.$store.getters.getWagmiConfig
        });

        const depositHash = await writeContractHelper(request);

        if (!depositHash) {
          throw new Error("Deposit transaction failed");
        }

        // 等待 deposit 交易完成
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 删除 deposit 等待提示
        if (notificationId) {
          await this.deleteNotification(notificationId);
        }

        // 显示 deposit 成功提示
        await this.createNotification({
          type: "success",
          title: "Success",
          message: "Deposit successful"
        });

        // 3. 执行 swap 操作
        notificationId = await this.createNotification({
          type: "pending",
          title: "Pending",
          message: "Swap in progress"
        });

        // 使用 CPMMDEXModule 合约
        const cpmmDexContract = {
          address: "0xa30D484f7618c1f72F4FF08c29598c2134d7BC21" as Address,
          abi: CPMMDEXModule,
        };

        // 根据代币类型确定输入金额
        let token0InAmt = 0n;
        let token1InAmt = 0n;

        if (this.actionConfig.fromToken.config.contract.address.toLowerCase() === this.stableAddress.toLowerCase()) {
          token0InAmt = this.actionConfig.fromInputValue;
          token1InAmt = 0n;
        } else if (this.actionConfig.fromToken.config.contract.address.toLowerCase() === this.wethAddress.toLowerCase()) {
          token0InAmt = 0n;
          token1InAmt = this.actionConfig.fromInputValue;
        }

        // 调用 swap 方法
        const { request: swapRequest } = await simulateContractHelper({
          address: cpmmDexContract.address,
          abi: cpmmDexContract.abi,
          functionName: "swap",
          args: [
            this.account as Address,                                        // to
            token0InAmt,                                                    // token0InAmt
            token1InAmt,                                                    // token1InAmt
            0n,                                                             // token0OutMin
            0n                                                              // token1OutMin
          ],
          wagmiConfig: this.$store.getters.getWagmiConfig
        });

        const swapHash = await writeContractHelper(swapRequest);

        if (!swapHash) {
          throw new Error("Swap transaction failed");
        }

        // 等待 swap 交易完成
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 删除 swap 等待提示
        if (notificationId) {
          await this.deleteNotification(notificationId);
        }

        // 显示 swap 成功提示
        await this.createNotification({
          type: "success",
          title: "Success",
          message: "Swap completed successfully"
        });

        return true;
      } catch (error: any) {
        console.error("Transaction Error:", error);
        
        // 删除等待提示
        if (notificationId) {
          await this.deleteNotification(notificationId);
        }
        
        let errorMessage = "Unexpected error occurred during transaction";
        
        // 处理常见错误类型
        if (error.message.includes("User rejected") || error.code === "ACTION_REJECTED") {
          errorMessage = "Transaction was rejected";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas";
        } else if (error.message.includes("contract call reverted")) {
          errorMessage = "Contract call failed";
        } else if (error.message.includes("Failed to initialize wallet configuration")) {
          errorMessage = "Please reconnect your wallet";
          // 尝试重新初始化钱包
          await this.initializeWeb3Modal();
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        // 显示错误提示
        await this.createNotification({
          type: "error",
          title: "Error",
          message: errorMessage
        });
        return false;
      } finally {
        this.isApproving = false;
      }
    },

    async actionHandler() {
      try {
        console.log("Action handler triggered:", {
          isAllowed: this.actionValidationData.isAllowed,
          isFetchSwapInfo: this.isFetchSwapInfo,
          validationMethod: this.actionValidationData?.method,
          account: this.account,
          chainId: this.chainId,
          selectedNetwork: this.selectedNetwork,
          walletStatus: {
            hasEthereum: typeof window.ethereum !== 'undefined',
            isConnected: window.ethereum?.isConnected?.(),
            hasProviders: window.ethereum?.providers && Array.isArray(window.ethereum.providers),
            wagmiConfig: this.$store.getters.getWagmiConfig ? 'exists' : 'missing',
            isWalletCheckInProcess: this.$store.getters.getIsWalletCheckInProcess,
            isWalletConnected: this.$store.getters.getWalletIsConnected
          }
        });

        if (!this.actionValidationData.isAllowed || this.isFetchSwapInfo) {
          return false;
        }

        // @ts-ignore
        switch (this.actionValidationData && this.actionValidationData.method) {
          case "connectWallet":
            try {
              this.walletStatus.isConnecting = true;
              this.walletStatus.connectionAttempts++;
              
              console.log("Initiating wallet connection...", {
                attempt: this.walletStatus.connectionAttempts,
                hasEthereum: typeof window.ethereum !== 'undefined',
                ethereumState: window.ethereum ? {
                  isConnected: window.ethereum?.isConnected?.(),
                  hasProviders: Array.isArray(window.ethereum?.providers),
                  providersCount: window.ethereum?.providers?.length || 0,
                  selectedAddress: window.ethereum?.selectedAddress,
                  chainId: window.ethereum?.chainId
                } : null,
                storeState: {
                  account: this.$store.getters.getAccount,
                  chainId: this.$store.getters.getChainId,
                  isWalletConnected: this.$store.getters.getWalletIsConnected
                }
              });

              // 检查是否在 iframe 中
              const isInIframe = window !== window.parent;
              if (isInIframe) {
                console.log("Running in iframe, using special connection handling");
                // 在 iframe 中时使用特殊的连接处理
                await this.handleIframeConnection();
                return;
              }
              
              // 检查并初始化Web3Modal
              const isWeb3ModalReady = await this.checkWeb3ModalStatus();
              if (!isWeb3ModalReady) {
                console.log("Web3Modal not ready, attempting initialization");
                const isInitialized = await this.initializeWeb3Modal();
                if (!isInitialized) {
                  throw new Error("Failed to initialize Web3Modal");
                }
              }
              
              // 尝试连接
              let connectionSuccess = false;
              let retryCount = 0;
              const maxRetries = 3;
              
              while (!connectionSuccess && retryCount < maxRetries) {
                try {
                  console.log(`Connection attempt ${retryCount + 1}/${maxRetries}`);
                  await this.$openWeb3modal();
                  
                  // 等待连接完成
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                  // 检查连接状态
                  if (window.ethereum?.selectedAddress) {
                    connectionSuccess = true;
                    console.log("Connection successful");
                    break;
                  }
                } catch (error: any) {
                  console.warn(`Connection attempt ${retryCount + 1} failed:`, error);
                  if (error.message.includes("Could not establish connection")) {
                    // 特殊处理连接错误
                    await this.handleConnectionError(error);
                  }
                  retryCount++;
                  if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                  }
                }
              }
              
              if (!connectionSuccess) {
                throw new Error("Failed to establish connection after multiple attempts");
              }
              
              // 连接成功后更新状态
              await this.updateConnectionState();
              
            } catch (error) {
              const err = error as ExtendedError;
              console.error("Final connection error:", err);
              this.walletStatus.lastError = err;
              // 显示用户友好的错误消息
              this.createNotification({
                type: 'error',
                title: 'Connection Error',
                message: this.getConnectionErrorMessage(err)
              });
            } finally {
              this.walletStatus.isConnecting = false;
            }
            break;
          case "switchNetwork":
            await switchNetwork(this.selectedNetwork); //todo
            break;
          case "approvefromToken":
            await this.approveTokenHandler(
              this.actionConfig.fromToken.config.contract,
              this.actionConfig.fromInputValue
            );
            break;
          case "approveToToken":
            await this.approveTokenHandler(
              this.actionConfig.toToken.config.contract,
              this.actionConfig.toInputValue
            );
            break;
          default:
            this.openConfirmationPopup();
            break;
        }
      } catch (error) {
        console.error("Error in actionHandler:", error);
      }

      await this.createSwapInfo();
    },

    async handleIframeConnection() {
      console.log("Handling iframe connection");
      try {
        // 在 iframe 中时，尝试直接与 MetaMask 通信
        const ethereum = window.ethereum;
        if (ethereum?.isMetaMask) {
          const request = ethereum.request;
          if (!request) {
            throw new Error("Ethereum provider does not support requests");
          }
          await request({ method: 'eth_requestAccounts' });
          await this.updateConnectionState();
        } else {
          throw new Error("MetaMask not found in iframe");
        }
      } catch (error) {
        console.error("Iframe connection error:", error);
        throw error;
      }
    },

    async handleConnectionError(error: Error) {
      console.log("Handling connection error:", error.message);
      // 检查是否是特定的连接错误
      if (error.message.includes("Could not establish connection")) {
        // 等待一段时间后再重试
        await new Promise(resolve => setTimeout(resolve, 1500));
        // 检查 provider 状态
        await this.checkProviderStatus();
      }
    },

    async checkProviderStatus() {
      console.log("Checking provider status");
      const providers = window.ethereum?.providers || [];
      const providerInfo = providers.map(p => ({
        isMetaMask: p.isMetaMask,
        isConnected: p.isConnected?.(),
        selectedAddress: p.selectedAddress,
        chainId: p.chainId
      }));
      console.log("Available providers:", providerInfo);
    },

    getConnectionErrorMessage(error: ExtendedError): string {
      if (error.message.includes("Could not establish connection")) {
        return "Unable to connect to wallet. Please ensure your wallet extension is installed and unlocked.";
      }
      if (error.message.includes("User rejected")) {
        return "Connection request was rejected. Please try again.";
      }
      return "An error occurred while connecting. Please try again.";
    },

    async updateConnectionState() {
      console.log("Updating connection state");
      if (window.ethereum?.selectedAddress) {
        await this.$store.commit('setAccount', window.ethereum.selectedAddress);
        if (window.ethereum.chainId) {
          const chainId = parseInt(window.ethereum.chainId, 16);
          await this.$store.commit('setChainId', chainId);
        }
        await this.$store.commit('setWalletConnection', true);
        
        console.log("Connection state updated:", {
          account: this.$store.getters.getAccount,
          chainId: this.$store.getters.getChainId,
          isConnected: this.$store.getters.getWalletIsConnected
        });
      }
    },

    async createSwapInfo() {
      try {
        console.log("Creating swap info...", {
          isManualSwitch: this.isManualTokenSwitch,
          isFetchSwapInfo: this.isFetchSwapInfo
        });
        console.log("Current network:", this.selectedNetwork);
        console.log("Current account:", this.account);
        
        const poolConfigs = await getPoolConfigsByChains() || [];
        console.log("Pool configs:", poolConfigs);
        
        const filteredPools = poolConfigs.filter(pool => 
          pool.chainId === this.selectedNetwork
        );
        console.log("Filtered pools:", filteredPools);
        console.log("Filtered pools length:", filteredPools.length);

        let tokensList: TokenInfo[] = [];
        try {
          // 获取代币价格
          console.log("Getting token prices for pools:", filteredPools.map(p => p.name));
          const prices = await this.getTokensPrices(filteredPools);
          console.log("Token prices:", prices);
          console.log("Token prices length:", prices.length);
          
          console.log("Getting token list by pools...");
          tokensList = await getTokenListByPools(
            filteredPools,
            this.selectedNetwork,
            prices || [],
            this.account as Address
          ) || [];
          console.log("Token list from getTokenListByPools:", {
            tokens: tokensList,
            length: tokensList.length,
            names: tokensList.map(t => t.config.name)
          });
        } catch (error: any) {
          console.error("Error getting token list:", error);
          console.error("Error stack:", error.stack);
        }

        this.tokensList = tokensList;
        console.log("Updated tokensList:", {
          tokens: this.tokensList,
          length: this.tokensList.length,
          names: this.tokensList.map(t => t.config.name)
        });

        // 只在非手动切换状态下设置默认代币
        if (!this.isManualTokenSwitch && this.tokensList.length >= 2) {
          console.log("Setting default tokens from list");
          const currentFromToken = this.actionConfig.fromToken;
          const currentToToken = this.actionConfig.toToken;
          
          // 只在代币未设置或为空状态时设置默认代币
          if (currentFromToken.config.contract.address === "0x" || 
              currentToToken.config.contract.address === "0x") {
            // 确保两个代币都不同
            const fromToken = this.tokensList[0];
            const toToken = this.tokensList.find(t => 
              t.config.contract.address.toLowerCase() !== fromToken.config.contract.address.toLowerCase()
            ) || this.tokensList[1];

            console.log("Setting tokens:", {
              fromToken: {
                name: fromToken.config.name,
                address: fromToken.config.contract.address
              },
              toToken: {
                name: toToken.config.name,
                address: toToken.config.contract.address
              }
            });

            this.actionConfig.fromToken = fromToken;
            this.actionConfig.toToken = toToken;
          } else {
            // 更新现有代币的余额信息
            const updatedFromToken = this.tokensList.find(t => 
              t.config.contract.address.toLowerCase() === currentFromToken.config.contract.address.toLowerCase()
            );
            const updatedToToken = this.tokensList.find(t => 
              t.config.contract.address.toLowerCase() === currentToToken.config.contract.address.toLowerCase()
            );

            if (updatedFromToken) {
              this.actionConfig.fromToken = updatedFromToken;
            }

            if (updatedToToken) {
              this.actionConfig.toToken = updatedToToken;
            }
          }
        } else if (this.tokensList.length < 2 && !this.isManualTokenSwitch) {
          console.log("Using empty state tokens");
          this.actionConfig.fromToken = {
            ...emptyTokenInfo,
            config: {
              ...emptyTokenInfo.config,
              name: "Stable",
              decimals: 18,
              contract: {
                address: this.stableAddress,
                abi: ""
              }
            }
          };
          this.actionConfig.toToken = {
            ...emptyTokenInfo,
            config: {
              ...emptyTokenInfo.config,
              name: "WETH",
              decimals: 18,
              contract: {
                address: this.wethAddress,
                abi: ""
              }
            }
          };
          console.log("Set empty fromToken:", this.actionConfig.fromToken.config.name);
          console.log("Set empty toToken:", this.actionConfig.toToken.config.name);
        }

        // 只在有账户时获取池子列表
        if (this.account) {
          try {
            console.log("Getting pools list...");
            
            // 使用简单的池子列表，不使用 multicall3
            this.poolsList = filteredPools.map(pool => ({
              ...pool,
              baseToken: pool.baseToken.contract.address,
              quoteToken: pool.quoteToken.contract.address,
              lpInfo: {
                baseToken: pool.baseToken.contract.address,
                quoteToken: pool.quoteToken.contract.address,
                midPrice: 0,
                baseReserve: 0n,
                quoteReserve: 0n
              }
            }));
            
            console.log("Updated poolsList:", this.poolsList);
            console.log("Pools list length:", this.poolsList.length);
          } catch (error: any) {
            console.error("Error getting pools list:", error);
            console.error("Error stack:", error.stack);
            this.poolsList = [];
          }
        } else {
          console.log("No account, skipping pools list retrieval");
          this.poolsList = [];
        }

        // 更新代币信息但保持顺序
        if (!this.isManualTokenSwitch) {
          this.updatedTokenInfo();
        }
      } catch (error: any) {
        console.error("Error in createSwapInfo:", error);
        console.error("Error stack:", error.stack);
        this.tokensList = [];
        this.poolsList = [];
      }
    },

    changeNetwork(network: number) {
      this.selectedNetwork = network;
    },

    selectBaseTokens() {
      const fromToken = this.tokensList.find(
        (token: TokenInfo) => token.config.name !== "MIM"
      );
      const toToken = this.tokensList.find(
        (token: TokenInfo) => token.config.name === "MIM"
      );

      if (fromToken) {
        this.actionConfig.fromToken = fromToken;
      }
      if (toToken) {
        this.actionConfig.toToken = toToken;
      }
    },

    checkAndSetSelectedChain() {
      if (this.availableNetworks.includes(this.chainId)) {
        this.selectedNetwork = this.chainId;
      }
    },

    updatedTokenInfo() {
      if (this.actionConfig.fromToken.config.contract.address === "0x") return;
      if (this.actionConfig.toToken.config.contract.address === "0x") return;

      const fromToken = this.tokensList.find(
        (token: TokenInfo) =>
          this.actionConfig.fromToken.config.contract.address.toLowerCase() ===
          token.config.contract.address.toLowerCase()
      );

      if (fromToken) this.actionConfig.fromToken = fromToken;

      const toToken = this.tokensList.find(
        (token: TokenInfo) =>
          this.actionConfig.toToken.config.contract.address.toLowerCase() ===
          token.config.contract.address.toLowerCase()
      );

      if (toToken) this.actionConfig.toToken = toToken;
    },

    formatAddress(address: string): string {
      if (!address) return '';
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },

    formatUnits,

    async checkWalletStatus() {
      console.log("Checking wallet status:", {
        hasEthereum: typeof window.ethereum !== 'undefined',
        isConnected: window.ethereum?.isConnected?.(),
        providers: window.ethereum?.providers,
        selectedAddress: window.ethereum?.selectedAddress,
        ethereumChainId: window.ethereum?.chainId,
        account: this.account,
        chainId: this.chainId,
        storeState: {
          account: this.$store.getters.getAccount,
          chainId: this.$store.getters.getChainId,
          isWalletConnected: this.$store.getters.getWalletIsConnected
        }
      });
    },

    async initializeWeb3Modal() {
      try {
        console.log("Initializing Web3Modal...");
        
        // 添加错误处理
        window.addEventListener('error', (event) => {
          // 忽略特定域名的错误
          if (event.filename && (
              event.filename.includes('g9904216750.co') ||
              event.filename.includes('localhost:5173')
          )) {
            event.preventDefault();
            return false;
          }
        }, true);

        const { initWeb3Modal } = await import("@/plugins/walletConnect/initWeb3Modal");
        const { web3modal, wagmiConfig } = await initWeb3Modal();
        
        if (!web3modal || !wagmiConfig) {
          console.error("Failed to initialize Web3Modal:", { web3modal, wagmiConfig });
          return false;
        }
        
        console.log("Web3Modal initialized successfully:", {
          web3modal: web3modal ? 'exists' : 'missing',
          wagmiConfig: wagmiConfig ? 'exists' : 'missing'
        });

        // 检查是否已经连接
        const isConnected = window.ethereum?.isConnected?.();
        const selectedAddress = window.ethereum?.selectedAddress;
        const chainIdHex = window.ethereum?.chainId;

        if (isConnected && selectedAddress && chainIdHex) {
          console.log("Wallet already connected, syncing state...", {
            isConnected,
            selectedAddress,
            chainIdHex
          });
          
          // 更新 store 状态
          if (typeof selectedAddress === 'string') {
            await this.$store.commit('setAccount', selectedAddress);
          }
          if (typeof chainIdHex === 'string') {
            const chainIdNum = parseInt(chainIdHex, 16);
            await this.$store.commit('setChainId', chainIdNum);
          }
          await this.$store.commit('setWalletConnection', true);
          
          // 验证状态更新
          console.log("Store state after sync:", {
            account: this.$store.getters.getAccount,
            chainId: this.$store.getters.getChainId,
            isWalletConnected: this.$store.getters.getWalletIsConnected
          });
        } else {
          console.log("Wallet not connected or missing required data:", {
            isConnected,
            selectedAddress,
            chainIdHex
          });
        }
        
        return true;
      } catch (error) {
        console.error("Error initializing Web3Modal:", error);
        return false;
      }
    },

    async retryConnection(maxAttempts = 3) {
      console.log("Starting connection retry process...");
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`Connection attempt ${attempts}/${maxAttempts}`);
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          // @ts-ignore
          await this.$openWeb3modal();
          
          // 等待连接完成
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          if (this.$store.getters.getAccount) {
            console.log("Connection successful on retry");
            return true;
          }
        } catch (error) {
          console.error(`Retry attempt ${attempts} failed:`, error);
        }
      }
      
      console.log("All retry attempts failed");
      return false;
    },

    async checkWeb3ModalStatus() {
      try {
        const wagmiConfig = this.$store.getters.getWagmiConfig;
        const isWalletConnected = this.$store.getters.getWalletIsConnected;
        
        console.log("Checking Web3Modal status:", {
          wagmiConfig: wagmiConfig ? 'exists' : 'missing',
          isWalletConnected,
          ethereum: {
            exists: typeof window.ethereum !== 'undefined',
            isConnected: window.ethereum?.isConnected?.(),
            selectedAddress: window.ethereum?.selectedAddress,
            chainId: window.ethereum?.chainId
          }
        });
        
        return wagmiConfig && typeof window.ethereum !== 'undefined';
      } catch (error) {
        console.error("Error checking Web3Modal status:", error);
        return false;
      }
    },

    // 添加新方法：检查网络是否支持 multicall3
    async checkMulticallSupport() {
      try {
        // BSC 测试网暂时不支持 multicall3
        if (this.selectedNetwork === 97) {
          console.log("BSC Testnet detected, multicall3 not supported");
          return false;
        }
        return true;
      } catch (error) {
        console.warn("Error checking network support:", error);
        return false;
      }
    },

    updateLendFromValue(value: bigint, fromInputAmount: string) {
      if (fromInputAmount === '') {
        this.lendConfig.fromInputAmount = "0";
        this.lendConfig.fromInputValue = 0n;
      } else {
        this.lendConfig.fromInputAmount = fromInputAmount;
        this.lendConfig.fromInputValue = value || 0n;
      }
    },

    updateLendToValue(value: bigint, amount: string) {
      this.lendConfig.toInputValue = value;
      this.lendConfig.toInputAmount = amount;
    },

    updateLendStableValue(value: bigint, amount: string) {
      this.lendConfig.stableInputValue = value;
      this.lendConfig.stableInputAmount = amount;
    },

    updateLendWrappedValue(value: bigint, amount: string) {
      this.lendConfig.wrappedInputValue = value;
      this.lendConfig.wrappedInputAmount = amount;
    },

    openLendTokensPopup(type: string) {
      this.tokenType = type;
      this.isLendTokenSelection = true;
      this.isTokensPopupOpened = true;
    },

    handleLendEnterAmount() {
      // 检查钱包连接状态
      if (!this.account) {
        this.createNotification({
          type: "error",
          title: "Error",
          message: "Please connect your wallet first"
        });
        return;
      }

      // 调用 lend 处理函数
      this.handleLendDeposit();
    },

    handleLendWithdraw() {
      // 检查钱包连接状态
      if (!this.account) {
        this.createNotification({
          type: "error",
          title: "Error",
          message: "Please connect your wallet first"
        });
        return;
      }

      // 调用 withdraw 处理函数
      this.handleLendWithdrawProcess();
    },

    async handleLendDeposit() {
      let notificationId;
      try {
        // 基础检查
        if (!this.account || !this.$store.getters.getWalletIsConnected) {
          // 优先尝试使用 MetaMask
          if (window.ethereum?.isMetaMask) {
            try {
              await window.ethereum.request({ method: 'eth_requestAccounts' });
              // 等待连接完成
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // 检查连接是否成功
              if (!window.ethereum.selectedAddress) {
                throw new Error("MetaMask connection failed");
              }
              
              // 更新账户信息
              await this.$store.commit('setAccount', window.ethereum.selectedAddress);
              const chainId = parseInt(window.ethereum.chainId, 16);
              await this.$store.commit('setChainId', chainId);
              await this.$store.commit('setWalletConnection', true);
            } catch (error) {
              console.error("MetaMask connection error:", error);
              // 如果 MetaMask 连接失败，再尝试其他方式
              await this.$openWeb3modal();
            }
          } else {
            // 如果没有 MetaMask，使用 Web3Modal
            await this.$openWeb3modal();
          }
          
          // 最终检查连接状态
          if (!this.account || !this.$store.getters.getWalletIsConnected) {
            throw new Error("Please connect your wallet first");
          }
        }

        if (this.chainId !== this.selectedNetwork) {
          throw new Error("Please switch to the correct network");
        }

        // 检查并初始化 wagmiConfig
        let wagmiConfig = this.$store.getters.getWagmiConfig;
        if (!wagmiConfig) {
          try {
            const { initWeb3Modal } = await import("@/plugins/walletConnect/initWeb3Modal");
            const { wagmiConfig: newConfig } = await initWeb3Modal();
            if (!newConfig) {
              throw new Error("Failed to initialize wallet configuration");
            }
            await this.$store.commit('setWagmiConfig', newConfig);
            wagmiConfig = newConfig;
          } catch (error) {
            console.error("Failed to initialize wagmiConfig:", error);
            throw new Error("Failed to initialize wallet. Please try again with MetaMask.");
          }
        }

        // 检查是否已选择代币
        if (!this.lendConfig.fromToken || 
            !this.lendConfig.fromToken.config || 
            !this.lendConfig.fromToken.config.contract || 
            !this.lendConfig.fromToken.config.contract.address || 
            this.lendConfig.fromToken.config.contract.address === "0x") {
          throw new Error("Please select a token first");
        }

        // 检查输入金额
        if (!this.lendConfig.fromInputAmount || this.lendConfig.fromInputAmount === "0") {
          throw new Error("Please enter a valid amount");
        }

        // 确保 fromInputValue 已正确设置
        if (!this.lendConfig.fromInputValue || this.lendConfig.fromInputValue === 0n) {
          const decimals = this.lendConfig.fromToken.config.decimals;
          this.lendConfig.fromInputValue = parseUnits(this.lendConfig.fromInputAmount, decimals);
        }

        this.isLendLoading = true;

        // Step 1: Approve
        notificationId = await this.createNotification({
          type: "pending",
          title: "Step 1/3",
          message: "Approving token..."
        });

        // 使用代币的 ERC20 合约地址
        const erc20Contract = {
          address: this.lendConfig.fromToken.config.contract.address as Address,
          abi: erc20Abi,
        };

        // 根据代币类型选择正确的 spender 地址
        const spenderAddress = "0x532e712D6F5B9aEB33b567101B44205F9561d37f" as Address;

        const approveHash = await approveTokenViem(
          erc20Contract,
          spenderAddress,
          this.lendConfig.fromInputValue,
          wagmiConfig
        );

        if (!approveHash) {
          throw new Error("Approve transaction failed");
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (notificationId) {
          await this.deleteNotification(notificationId);
        }

        await this.createNotification({
          type: "success",
          title: "Step 1/3 Complete",
          message: "Token approved successfully"
        });

        // Step 2: Deposit
        notificationId = await this.createNotification({
          type: "pending",
          title: "Step 2/3",
          message: "Processing deposit..."
        });

        const liquidityContract = {
          address: "0x532e712D6F5B9aEB33b567101B44205F9561d37f" as Address,
          abi: FlexiFusionLiquidityModule,
        };

        const { request: depositRequest } = await simulateContractHelper({
          address: liquidityContract.address,
          abi: liquidityContract.abi,
          functionName: "deposit",
          args: [
            this.account as Address,
            this.lendConfig.fromToken.config.contract.address.toLowerCase() === this.stableAddress.toLowerCase() 
              ? this.lendConfig.fromInputValue 
              : 0n,
            this.lendConfig.fromToken.config.contract.address.toLowerCase() === this.wethAddress.toLowerCase() 
              ? this.lendConfig.fromInputValue 
              : 0n
          ],
          wagmiConfig
        });

        const depositHash = await writeContractHelper(depositRequest);
        if (!depositHash) {
          throw new Error("Deposit transaction failed");
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        if (notificationId) {
          await this.deleteNotification(notificationId);
        }

        await this.createNotification({
          type: "success",
          title: "Step 2/3 Complete",
          message: "Deposit successful"
        });

        // Step 3: Supply
        notificationId = await this.createNotification({
          type: "pending",
          title: "Step 3/3",
          message: "Processing supply..."
        });

        const lendingContract = {
          address: "0x23e002ff7c342Fc30e1DdC68183C8017FACA91b2" as Address,
          abi: FlexiLendingModule,
        };

        const isStableToken = this.lendConfig.fromToken.config.contract.address.toLowerCase() === this.stableAddress.toLowerCase();
        const functionName = isStableToken ? "supply" : "supplyCollateral";
        const args = isStableToken 
          ? [this.lendConfig.fromInputValue, 0n, this.account as Address]
          : [this.lendConfig.fromInputValue, this.account as Address];

        const { request: supplyRequest } = await simulateContractHelper({
          address: lendingContract.address,
          abi: lendingContract.abi,
          functionName,
          args,
          wagmiConfig
        });

        if (!supplyRequest) {
          throw new Error(`Failed to simulate ${functionName} transaction`);
        }

        const supplyHash = await writeContractHelper(supplyRequest);
        if (!supplyHash) {
          throw new Error(`${functionName} transaction failed`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        if (notificationId) {
          await this.deleteNotification(notificationId);
        }

        await this.createNotification({
          type: "success",
          title: "Complete",
          message: "All steps completed successfully"
        });

        this.lendConfig.fromInputValue = 0n;
        this.lendConfig.fromInputAmount = "0";

      } catch (error: any) {
        console.error("Transaction error:", error);
        let errorMessage = "Transaction failed";
        
        if (error.message.includes("User rejected") || error.code === "ACTION_REJECTED") {
          errorMessage = "Transaction was rejected";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas";
        } else if (error.message.includes("contract call reverted")) {
          errorMessage = "Contract call failed";
        } else if (error.message.includes("Failed to initialize wallet configuration")) {
          errorMessage = "Please try connecting with MetaMask";
        } else if (error.message.includes("WebSocket connection failed")) {
          errorMessage = "Connection failed. Please use MetaMask instead.";
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        if (notificationId) {
          await this.deleteNotification(notificationId);
        }

        await this.createNotification({
          type: "error",
          title: "Error",
          message: errorMessage
        });
      } finally {
        this.isLendLoading = false;
      }
    },

    async handleLendWithdrawProcess() {
      let notificationId;
      try {
        // 基础检查
        if (!this.account || !this.$store.getters.getWalletIsConnected) {
          // 优先尝试使用 MetaMask
          if (window.ethereum?.isMetaMask) {
            try {
              await window.ethereum.request({ method: 'eth_requestAccounts' });
              // 等待连接完成
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // 检查连接是否成功
              if (!window.ethereum.selectedAddress) {
                throw new Error("MetaMask connection failed");
              }
              
              // 更新账户信息
              await this.$store.commit('setAccount', window.ethereum.selectedAddress);
              const chainId = parseInt(window.ethereum.chainId, 16);
              await this.$store.commit('setChainId', chainId);
              await this.$store.commit('setWalletConnection', true);
            } catch (error) {
              console.error("MetaMask connection error:", error);
              // 如果 MetaMask 连接失败，再尝试其他方式
              await this.$openWeb3modal();
            }
          } else {
            // 如果没有 MetaMask，使用 Web3Modal
            await this.$openWeb3modal();
          }
          
          // 最终检查连接状态
          if (!this.account || !this.$store.getters.getWalletIsConnected) {
            throw new Error("Please connect your wallet first");
          }
        }

        if (this.chainId !== this.selectedNetwork) {
          throw new Error("Please switch to the correct network");
        }

        // 检查并初始化 wagmiConfig
        let wagmiConfig = this.$store.getters.getWagmiConfig;
        if (!wagmiConfig) {
          try {
            const { initWeb3Modal } = await import("@/plugins/walletConnect/initWeb3Modal");
            const { wagmiConfig: newConfig } = await initWeb3Modal();
            if (!newConfig) {
              throw new Error("Failed to initialize wallet configuration");
            }
            await this.$store.commit('setWagmiConfig', newConfig);
            wagmiConfig = newConfig;
          } catch (error) {
            console.error("Failed to initialize wagmiConfig:", error);
            throw new Error("Failed to initialize wallet. Please try again with MetaMask.");
          }
        }

        if (!this.lendConfig.toInputValue || this.lendConfig.toInputValue === 0n) {
          throw new Error("Please enter a valid amount");
        }

        this.isLendLoading = true;

        // Withdraw from Lending Module
        notificationId = await this.createNotification({
          type: "pending",
          title: "Processing",
          message: "Processing withdraw..."
        });

        const lendingContract = {
          address: "0x23e002ff7c342Fc30e1DdC68183C8017FACA91b2" as Address,
          abi: FlexiLendingModule,
        };

        const isStableToken = this.lendConfig.toToken.config.contract.address.toLowerCase() === this.stableAddress.toLowerCase();
        const functionName = isStableToken ? "withdraw" : "withdrawCollateral";
        const args = isStableToken 
          ? [this.lendConfig.toInputValue, 0n, this.account as Address, this.account as Address]
          : [this.lendConfig.toInputValue, this.account as Address, this.account as Address];

        const { request: withdrawRequest } = await simulateContractHelper({
          address: lendingContract.address,
          abi: lendingContract.abi,
          functionName,
          args,
          wagmiConfig
        });

        if (!withdrawRequest) {
          throw new Error(`Failed to simulate ${functionName} transaction`);
        }

        const withdrawHash = await writeContractHelper(withdrawRequest);
        if (!withdrawHash) {
          throw new Error(`${functionName} transaction failed`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        if (notificationId) {
          await this.deleteNotification(notificationId);
        }

        await this.createNotification({
          type: "success",
          title: "Success",
          message: "Withdraw completed successfully"
        });

        this.lendConfig.toInputValue = 0n;
        this.lendConfig.fromInputAmount = "0";

      } catch (error: any) {
        console.error("Transaction error:", error);
        let errorMessage = "Transaction failed";
        
        if (error.message.includes("User rejected") || error.code === "ACTION_REJECTED") {
          errorMessage = "Transaction was rejected";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas";
        } else if (error.message.includes("contract call reverted")) {
          errorMessage = "Contract call failed";
        } else if (error.message.includes("Failed to initialize wallet configuration")) {
          errorMessage = "Please try connecting with MetaMask";
        } else if (error.message.includes("WebSocket connection failed")) {
          errorMessage = "Connection failed. Please use MetaMask instead.";
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        if (notificationId) {
          await this.deleteNotification(notificationId);
        }

        await this.createNotification({
          type: "error",
          title: "Error",
          message: errorMessage
        });
      } finally {
        this.isLendLoading = false;
      }
    },

    async handleLendBorrow() {
      let notificationId;
      try {
        // 基础检查
        if (!this.account || !this.$store.getters.getWalletIsConnected) {
          throw new Error("Please connect your wallet first");
        }

        if (this.chainId !== this.selectedNetwork) {
          throw new Error("Please switch to the correct network");
        }

        // 检查并初始化 wagmiConfig
        let wagmiConfig = this.$store.getters.getWagmiConfig;
        if (!wagmiConfig) {
          try {
            const { initWeb3Modal } = await import("@/plugins/walletConnect/initWeb3Modal");
            const { wagmiConfig: newConfig } = await initWeb3Modal();
            if (!newConfig) {
              throw new Error("Failed to initialize wallet configuration");
            }
            await this.$store.commit('setWagmiConfig', newConfig);
            wagmiConfig = newConfig;
          } catch (error) {
            console.error("Failed to initialize wagmiConfig:", error);
            throw new Error("Failed to initialize wallet. Please try again with MetaMask.");
          }
        }

        // 移除金额为0的检查，允许金额为0
        if (this.lendConfig.stableInputValue === undefined) {
          throw new Error("Please enter an amount");
        }

        this.isLendLoading = true;

        // Borrow from Lending Module
        notificationId = await this.createNotification({
          type: "pending",
          title: "Processing",
          message: "Processing borrow..."
        });

        const lendingContract = {
          address: "0x23e002ff7c342Fc30e1DdC68183C8017FACA91b2" as Address,
          abi: FlexiLendingModule,
        };

        const { request: borrowRequest } = await simulateContractHelper({
          address: lendingContract.address,
          abi: lendingContract.abi,
          functionName: "borrow",
          args: [
            this.lendConfig.stableInputValue,  // assets
            0n,                                // shares (0 means calculate automatically)
            this.account as Address,           // onBehalf
            this.account as Address            // receiver
          ],
          wagmiConfig
        });

        if (!borrowRequest) {
          throw new Error("Failed to simulate borrow transaction");
        }

        const borrowHash = await writeContractHelper(borrowRequest);
        if (!borrowHash) {
          throw new Error("Borrow transaction failed");
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        if (notificationId) {
          await this.deleteNotification(notificationId);
        }

        await this.createNotification({
          type: "success",
          title: "Success",
          message: "Borrow completed successfully"
        });

        this.lendConfig.stableInputValue = 0n;
        this.lendConfig.stableInputAmount = "0";

      } catch (error: any) {
        console.error("Transaction error:", error);
        let errorMessage = "Transaction failed";
        
        if (error.message.includes("User rejected") || error.code === "ACTION_REJECTED") {
          errorMessage = "Transaction was rejected";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas";
        } else if (error.message.includes("contract call reverted")) {
          errorMessage = "Contract call failed";
        } else if (error.message.includes("Failed to initialize wallet configuration")) {
          errorMessage = "Please try connecting with MetaMask";
        } else if (error.message.includes("WebSocket connection failed")) {
          errorMessage = "Connection failed. Please use MetaMask instead.";
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        if (notificationId) {
          await this.deleteNotification(notificationId);
        }

        await this.createNotification({
          type: "error",
          title: "Error",
          message: errorMessage
        });
      } finally {
        this.isLendLoading = false;
      }
    },

    async handleLendRepay() {
      let notificationId;
      try {
        // 基础检查
        if (!this.account || !this.$store.getters.getWalletIsConnected) {
          throw new Error("Please connect your wallet first");
        }

        if (this.chainId !== this.selectedNetwork) {
          throw new Error("Please switch to the correct network");
        }

        // 检查并初始化 wagmiConfig
        let wagmiConfig = this.$store.getters.getWagmiConfig;
        if (!wagmiConfig) {
          try {
            const { initWeb3Modal } = await import("@/plugins/walletConnect/initWeb3Modal");
            const { wagmiConfig: newConfig } = await initWeb3Modal();
            if (!newConfig) {
              throw new Error("Failed to initialize wallet configuration");
            }
            await this.$store.commit('setWagmiConfig', newConfig);
            wagmiConfig = newConfig;
          } catch (error) {
            console.error("Failed to initialize wagmiConfig:", error);
            throw new Error("Failed to initialize wallet. Please try again with MetaMask.");
          }
        }

        // 移除金额为0的检查，允许金额为0
        if (this.lendConfig.wrappedInputValue === undefined) {
          throw new Error("Please enter an amount");
        }

        this.isLendLoading = true;

        // Repay to Lending Module
        notificationId = await this.createNotification({
          type: "pending",
          title: "Processing",
          message: "Processing repay..."
        });

        const lendingContract = {
          address: "0x23e002ff7c342Fc30e1DdC68183C8017FACA91b2" as Address,
          abi: FlexiLendingModule,
        };

        const { request: repayRequest } = await simulateContractHelper({
          address: lendingContract.address,
          abi: lendingContract.abi,
          functionName: "repay",
          args: [
            this.lendConfig.wrappedInputValue,  // assets
            0n,                                 // shares (0 means calculate automatically)
            this.account as Address             // onBehalf
          ],
          wagmiConfig
        });

        if (!repayRequest) {
          throw new Error("Failed to simulate repay transaction");
        }

        const repayHash = await writeContractHelper(repayRequest);
        if (!repayHash) {
          throw new Error("Repay transaction failed");
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        if (notificationId) {
          await this.deleteNotification(notificationId);
        }

        await this.createNotification({
          type: "success",
          title: "Success",
          message: "Repay completed successfully"
        });

        this.lendConfig.wrappedInputValue = 0n;
        this.lendConfig.wrappedInputAmount = "0";

      } catch (error: any) {
        console.error("Transaction error:", error);
        let errorMessage = "Transaction failed";
        
        if (error.message.includes("User rejected") || error.code === "ACTION_REJECTED") {
          errorMessage = "Transaction was rejected";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas";
        } else if (error.message.includes("contract call reverted")) {
          errorMessage = "Contract call failed";
        } else if (error.message.includes("Failed to initialize wallet configuration")) {
          errorMessage = "Please try connecting with MetaMask";
        } else if (error.message.includes("WebSocket connection failed")) {
          errorMessage = "Connection failed. Please use MetaMask instead.";
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        if (notificationId) {
          await this.deleteNotification(notificationId);
        }

        await this.createNotification({
          type: "error",
          title: "Error",
          message: errorMessage
        });
      } finally {
        this.isLendLoading = false;
      }
    },
  },

  async created() {
    console.log("Component created");
    
    try {
      // 1. 初始化 Web3Modal
      console.log("Initializing Web3Modal...");
      await this.initializeWeb3Modal();
      
      // 2. 检查钱包状态
      console.log("Checking wallet status...");
      await this.checkWalletStatus();
      
      // 3. 开始加载数据
      this.isLoading = true;
      
      console.log("Getting pool configs...");
      this.poolConfigs = await getPoolConfigsByChains();
      console.log("Pool configs:", this.poolConfigs);
      
      console.log("Getting native token prices...");
      this.nativeTokenPrice = await getNativeTokensPrice(this.availableNetworks);
      console.log("Native token prices:", this.nativeTokenPrice);
      
      console.log("Checking and setting selected chain...");
      this.checkAndSetSelectedChain();
      console.log("Selected network:", this.selectedNetwork);
      
      console.log("Creating swap info...");
      await this.createSwapInfo();
      
      console.log("Selecting base tokens...");
      this.selectBaseTokens();
      
      this.isLoading = false;
      console.log("Component initialization complete:", {
        account: this.account,
        chainId: this.chainId,
        selectedNetwork: this.selectedNetwork,
        isLoading: this.isLoading
      });

      // 只在有账户时设置更新间隔
      if (this.account) {
        this.updateInterval = setInterval(async () => {
          if (this.account) {
            await this.createSwapInfo();
          }
        }, 10000);
      }
    } catch (error) {
      console.error("Error during component initialization:", error);
      this.isLoading = false;
    }
  },

  components: {
    SwapSettingsPopup: defineAsyncComponent(
      () => import("@/components/popups/swap/SwapSettingsPopup.vue")
    ),
    AvailableNetworksBlock: defineAsyncComponent(
      () => import("@/components/stake/AvailableNetworksBlock.vue")
    ),
    SwapForm: defineAsyncComponent(
      () => import("@/components/swap/SwapForm.vue")
    ),
    CurrentPrice: defineAsyncComponent(
      () => import("@/components/pools/CurrentPrice.vue")
    ),
    SwapInfoBlock: defineAsyncComponent(
      () => import("@/components/swap/SwapInfoBlock.vue")
    ),
    BaseButton: defineAsyncComponent(
      () => import("@/components/base/BaseButton.vue")
    ),
    LocalPopupWrap: defineAsyncComponent(
      // @ts-ignore
      () => import("@/components/popups/LocalPopupWrap.vue")
    ),
    SwapListPopup: defineAsyncComponent(
      () => import("@/components/popups/swap/SwapListPopup.vue")
    ),
    ConfirmationPopup: defineAsyncComponent(
      () => import("@/components/popups/swap/ConfirmationPopup.vue")
    ),
  },
});
</script>

<style lang="scss" scoped>
.link-button {
  width: max-content !important;
  margin: 0 auto 0 12px;
}

.swap-view {
  padding: 120px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100vh;
  width: 100%;
}

.swap-wrapper {
  max-width: 550px;
  width: 100%;
  padding: 0 8px;
  margin: 0 auto;
}

.swap-head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;

  .title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
}

.title {
  font-size: 32px;
  font-weight: 600;
  line-height: normal;
}

.swap-body {
  @include block-wrap;
  gap: 24px;
  display: flex;
  flex-direction: column;
}

.usd-price-block {
  background: var(--card-background);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usd-price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .label {
    color: var(--text-secondary);
    font-size: 14px;
  }
  
  .value {
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
  }
}

.wallet-info {
  background: var(--card-background);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wallet-address, .wallet-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .label {
    color: var(--text-secondary);
    font-size: 14px;
  }
  
  .value {
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
  }
}

.info-blocks {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;
  background: var(--card-background);
  border-radius: 16px;
}

.info-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.info-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 24px;
    height: 24px;
    color: var(--text-secondary);
  }
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  color: var(--text-secondary);
  font-size: 14px;
}

.info-value {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 500;
}

@media screen and (max-width: 600px) {
  .title {
    font-size: 24px;
  }

  .swap-body {
    padding: 16px;
    gap: 20px;
  }

  .info-blocks {
    grid-template-columns: 1fr;
  }

  .info-block {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
