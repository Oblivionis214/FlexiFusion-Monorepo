<template>
  <div class="inputs-wrap" :class="{ 'lend-form': showEnterAmountButton }">
    <!-- Swap Layout -->
    <template v-if="!showEnterAmountButton">
      <BaseTokenInput
        v-if="fromToken && !isLoading"
        :value="fromInputValue"
        :name="fromToken.config.name"
        :icon="fromToken.config.icon"
        :decimals="fromToken.config.decimals"
        :max="fromToken.userInfo.balance"
        :tokenPrice="fromTokenPrice"
        allowSelectToken
        @onSelectClick="$emit('openTokensPopup', 'from')"
        @updateInputValue="updateFromInputValue"
      />
      <BaseTokenInputSkeleton v-else />

      <button v-if="showSwapButton" class="swap-button" @click="onToogleTokens">
        <SwapIcon />
      </button>

      <BaseTokenInput
        v-if="toToken && !isLoading"
        :disabled="true"
        :value="toInputValue"
        :name="toToken.config.name"
        :icon="toToken.config.icon"
        :decimals="toToken.config.decimals"
        :max="toToken.userInfo.balance"
        :tokenPrice="toTokenPrice"
        :differencePrice="differencePrice"
        allowSelectToken
        @onSelectClick="$emit('openTokensPopup', 'to')"
      />
      <BaseTokenInputSkeleton v-else />
    </template>

    <!-- Lend Layout -->
    <template v-else>
      <!-- First Input -->
      <BaseTokenInput
        v-if="fromToken && !isLoading"
        :value="fromInputValue"
        :name="fromToken.config.name"
        :icon="fromToken.config.icon"
        :decimals="fromToken.config.decimals"
        :max="fromToken.userInfo.balance"
        :tokenPrice="fromTokenPrice"
        allowSelectToken
        @onSelectClick="$emit('openTokensPopup', 'from')"
        @updateInputValue="updateFromInputValue"
      />
      <BaseTokenInputSkeleton v-else />

      <!-- First Button -->
      <button class="enter-amount-button" @click="onEnterAmount">
        Enter Amount
      </button>

      <!-- Second Input -->
      <BaseTokenInput
        v-if="toToken && !isLoading"
        :value="toInputValue"
        :name="toToken.config.name"
        :icon="toToken.config.icon"
        :decimals="toToken.config.decimals"
        :max="toToken.userInfo.balance"
        :tokenPrice="toTokenPrice"
        :differencePrice="differencePrice"
        allowSelectToken
        @onSelectClick="$emit('openTokensPopup', 'to')"
        @updateInputValue="updateToInputValue"
      />
      <BaseTokenInputSkeleton v-else />

      <!-- Second Button -->
      <button class="enter-amount-button" @click="onWithdraw">
        Enter Amount
      </button>

      <!-- Third Input (Stable) -->
      <BaseTokenInput
        v-if="!isLoading"
        :value="stableInputValue"
        name="Stable"
        icon="/src/assets/images/tokens/ETH.png"
        :decimals="6"
        :max="0n"
        :tokenPrice="0"
        @updateInputValue="updateStableInputValue"
      />
      <BaseTokenInputSkeleton v-else />

      <!-- Third Button -->
      <button class="enter-amount-button" @click="onBorrow">
        Enter Amount
      </button>

      <!-- Fourth Input (Wrap) -->
      <BaseTokenInput
        v-if="!isLoading"
        :value="wrappedInputValue"
        name="Wrapped Eth"
        icon="/src/assets/images/tokens/WETH.png"
        :decimals="18"
        :max="0n"
        :tokenPrice="0"
        @updateInputValue="updateWrappedInputValue"
      />
      <BaseTokenInputSkeleton v-else />

      <!-- Fourth Button -->
      <button class="enter-amount-button" @click="onRepay">
        Enter Amount
      </button>
    </template>
  </div>
</template>

<script lang="ts">
import { formatUnits, parseUnits } from "viem";
import { trimZeroDecimals } from "@/helpers/numbers";
import { defineAsyncComponent, type Prop } from "vue";
import type { TokenInfo } from "@/helpers/pools/swap/tokens";

export default {
  props: {
    fromToken: Object as Prop<TokenInfo>,
    toToken: Object as Prop<TokenInfo>,
    toTokenAmount: BigInt as Prop<bigint>,
    fromTokenPrice: { type: Number, default: 0 },
    toTokenPrice: { type: Number, default: 0 },
    differencePrice: { type: Number, default: 0 },
    isLoading: { type: Boolean, default: false },
    showSwapButton: { type: Boolean, default: true },
    showEnterAmountButton: { type: Boolean, default: false },
  },

  data() {
    return {
      fromInputValue: "",
      toInputValue: "",
      stableInputValue: "",
      wrappedInputValue: "",
    };
  },

  watch: {
    toTokenAmount: {
      handler(value) {
        const { decimals } = this.toToken!.config;

        if (!value) {
          this.toInputValue = "";
          this.fromInputValue = "";
        } else
          this.toInputValue = trimZeroDecimals(formatUnits(value, decimals));
      },
      immediate: true,
    },
  },

  methods: {
    updateFromInputValue(value: bigint) {
      if (!value) this.fromInputValue = "";
      else {
        const { decimals } = this.fromToken!.config;
        this.fromInputValue = trimZeroDecimals(formatUnits(value, decimals));
      }

      this.$emit("updateFromInputValue", value, this.fromInputValue);
    },

    updateToInputValue(value: bigint) {
      if (!value) this.toInputValue = "";
      else {
        const { decimals } = this.toToken!.config;
        this.toInputValue = trimZeroDecimals(formatUnits(value, decimals));
      }
      
      this.$emit("updateToInputValue", value, this.toInputValue);
    },

    updateStableInputValue(value: bigint) {
      if (!value) this.stableInputValue = "";
      else {
        const decimals = 6; // Stable token decimals
        this.stableInputValue = trimZeroDecimals(formatUnits(value, decimals));
      }
      
      this.$emit("updateStableInputValue", value, this.stableInputValue);
    },

    updateWrappedInputValue(value: bigint) {
      if (!value) this.wrappedInputValue = "";
      else {
        this.wrappedInputValue = trimZeroDecimals(formatUnits(value, 18));
      }
    },

    onToogleTokens() {
      this.$emit(
        "updateFromInputValue",
        parseUnits(this.fromInputValue, this.toToken!.config.decimals),
        this.fromInputValue
      );

      this.$emit("onToogleTokens");
    },

    onEnterAmount() {
      this.$emit("onEnterAmount");
    },

    onWithdraw() {
      this.$emit("onWithdraw");
    },

    onBorrow() {
      this.$emit("onBorrow");
    },

    onRepay() {
      this.$emit("onRepay");
    },

    onEnterAmountBottom() {
      this.$emit("onEnterAmountBottom");
    },
  },

  components: {
    BaseTokenInput: defineAsyncComponent(
      () => import("@/components/base/BaseTokenInput.vue")
    ),
    SwapIcon: defineAsyncComponent(
      () => import("@/components/ui/icons/SwapIcon.vue")
    ),
    BaseTokenInputSkeleton: defineAsyncComponent(
      () => import("@/components/ui/skeletons/BaseTokenInputSkeleton.vue")
    ),
  },
};
</script>

<style lang="scss" scoped>
.inputs-wrap {
  gap: 12px;
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 32px 0;
}

.swap-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  margin: 0 auto;
  border-radius: 16px;
  border: 1px solid #2d4a96;
  background: rgba(25, 31, 47, 0.38);
  box-shadow: 0px 4px 32px 0px rgba(103, 103, 103, 0.14);
  backdrop-filter: blur(68px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 2px;
}

.lend-form {
  padding: 32px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;

  .enter-amount-button {
    position: static;
    width: 100%;
    max-width: 400px;
    padding: 16px;
    margin: 0 auto;
    border-radius: 16px;
    background: linear-gradient(93.06deg, #4B2EFD 2.66%, #8E2EFD 98.99%);
    border: none;
    cursor: pointer;
    color: white;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    transition: all 0.3s ease;
    box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.25);
    z-index: 1;
    transform: none;
  }

  .enter-amount-button:hover {
    opacity: 0.9;
    transform: scale(1.02);
  }
}
</style>
