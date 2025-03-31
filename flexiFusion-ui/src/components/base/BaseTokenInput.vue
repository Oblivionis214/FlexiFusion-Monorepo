<template>
  <div class="wrap">
    <div :class="['val-input', { compact }]">
      <div class="token-input-wrap">
        <input
          name="tokenInput"
          class="text-field"
          v-model="inputValue"
          type="text"
          placeholder="0.0"
          :disabled="disabled"
        />
        <div class="usd-wrap" v-if="!compact">
          <p class="usd-equivalent" v-if="tokenPrice">{{ usdEquivalent }}</p>
          <p
            :class="['difference-price', { warning: differencePrice < 0 }]"
            v-if="differencePrice"
          >
            ( {{ formatToFixed(differencePrice, 2) }}%)
          </p>
        </div>
      </div>

      <div class="token-input-info">
        <div
          :class="[
            'token-info',
            {
              'select-token': allowSelectToken,
              'gradient-selector': isGradientSelector,
            },
          ]"
          v-tooltip="tooltip"
          @click="onSelectClick"
        >
          <BaseTokenIcon
            :icon="icon"
            :name="name"
            size="28px"
            v-if="!isGradientSelector"
          />
          <span class="token-name" ref="tokenName">
            {{ tokenName }}
          </span>

          <img
            class="arrow-icon"
            v-if="allowSelectToken"
            src="@/assets/images/arrow-down.svg"
            alt=""
          />
        </div>

        <p
          :class="['wallet-balance', { 'primary-max': primaryMax }]"
          v-if="!disabled && !compact && !isGradientSelector"
          @click="inputValue = formattedMax"
        >
          <span v-if="primaryMax">MAX:</span>
          <WalletIcon v-else :width="13" :height="13" fill="#575C62" />
          {{ formatTokenBalance(formattedMax) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  formatUSD,
  formatToFixed,
  formatTokenBalance,
} from "@/helpers/filters";
import { BigNumber, utils } from "ethers";
import { defineAsyncComponent } from "vue";
import { formatUnits, parseUnits } from "viem";

export default {
  props: {
    decimals: { type: Number, default: 18 },
    isBigNumber: { type: Boolean, default: false },
    max: {},
    value: {}, // TODO: use bignumber (bigint) & parse in data.inputValue
    icon: { type: String },
    name: { type: String, default: "Select Token" },
    tokenPrice: { type: [String, Number] },
    disabled: { type: Boolean, default: false },
    primaryMax: { type: Boolean, default: false },
    compact: { type: Boolean, default: false },
    allowSelectToken: { type: Boolean, default: false },
    isGradientSelector: { type: Boolean, default: false },
    poolCreation: { type: Boolean, default: false },
    differencePrice: { type: Number, default: 0 },
  },

  data(): any {
    return {
      inputValue: this.value,
      tooltip: "",
    };
  },

  computed: {
    tokenName() {
      return this.name.length > 12 ? this.name.slice(0, 11) + "..." : this.name;
    },

    formattedMax() {
      if (this.isBigNumber)
        return utils.formatUnits(this.max || 0, this.decimals);
      return formatUnits(this.max || 0, this.decimals);
    },

    usdEquivalent() {
      return formatUSD(this.inputValue * this.tokenPrice);
    },
  },

  watch: {
    inputValue(value) {
      if (!value) {
        if (this.isBigNumber) this.$emit("updateInputValue", BigNumber.from(0));
        else this.$emit("updateInputValue", BigInt(0));
        return;
      }

      // 只允许数字和小数点
      const numericValue = value.replace(/[^0-9.]/g, '');
      // 确保只有一个小数点
      const parts = numericValue.split('.');
      if (parts.length > 2) {
        this.inputValue = parts[0] + '.' + parts.slice(1).join('');
        return;
      }
      
      // 如果输入值改变了，更新显示值
      if (value !== numericValue) {
        this.inputValue = numericValue;
        return;
      }

      try {
        // 尝试转换为 BigInt
        this.updateInputValue(numericValue, this.decimals);
      } catch (error) {
        // 如果转换失败，保持当前值
        console.error('Error converting input:', error);
      }
    },

    value(value) {
      // 如果外部值变化，更新输入值
      if (value !== this.inputValue) {
        this.inputValue = value;
      }
    },

    decimals(newDecimals) {
      if (this.inputValue) {
        this.updateInputValue(this.inputValue, newDecimals);
      }
    },
  },

  methods: {
    formatTokenBalance,
    formatToFixed,

    onSelectClick() {
      if (this.allowSelectToken) this.$emit("onSelectClick");
      return;
    },

    updateInputValue(value: string, decimals: number) {
      if (!value || value === '.') {
        if (this.isBigNumber) {
          this.$emit("updateInputValue", BigNumber.from(0));
        } else {
          this.$emit("updateInputValue", BigInt(0));
        }
        return;
      }

      // 移除前导零
      let cleanValue = value.replace(/^0+(?=\d)/, '');
      if (cleanValue.startsWith('.')) {
        cleanValue = '0' + cleanValue;
      }

      // 处理小数部分
      const parts = cleanValue.split('.');
      const integerPart = parts[0] || '0';
      let decimalPart = parts[1] || '';

      // 限制小数位数
      if (decimalPart.length > decimals) {
        decimalPart = decimalPart.slice(0, decimals);
      }

      // 补齐小数位
      while (decimalPart.length < decimals) {
        decimalPart += '0';
      }

      const fullNumber = integerPart + decimalPart;
      
      try {
        if (this.isBigNumber) {
          this.$emit("updateInputValue", BigNumber.from(fullNumber));
        } else {
          this.$emit("updateInputValue", BigInt(fullNumber));
        }
      } catch (error) {
        console.error('Error converting to BigInt:', error);
      }
    },
  },

  mounted() {
    if (this.name.length > 12) {
      this.tooltip = this.name;
    }
  },

  components: {
    BaseTokenIcon: defineAsyncComponent(
      () => import("@/components/base/BaseTokenIcon.vue")
    ),
    WalletIcon: defineAsyncComponent(
      () => import("@/components/ui/icons/WalletIcon.vue")
    ),
  },
};
</script>

<style lang="scss" scoped>
.wrap {
  width: 100%;
}

.val-input {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 8px 22px;
  border-radius: 16px;
  border: 1px solid rgba(73, 70, 97, 0.4);
  background: rgba(8, 14, 31, 0.6);
  width: 100%;
  min-height: 82px;
}

.compact {
  min-height: auto;
}

.token-input-wrap,
.token-input-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 4px;
  height: 100%;
  max-width: 50%;
}

.text-field {
  height: 32px;
  color: #fff;
  font-size: 20px;
  font-weight: 500;
  background-color: transparent;
  border: none;
  max-width: 95%;
  width: 100%;
}

.text-field:focus {
  outline: none;
  border: none;
}

.usd-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.usd-equivalent {
  color: #575c62;
  font-size: 14px;
  font-weight: 400;
}

.difference-price {
  font-size: 14px;
  font-weight: 400;
  color: #67a069;
}

.warning {
  color: #8c4040;
}

.token-input-info {
  align-items: end;
}

.token-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  background: rgba(111, 111, 111, 0.06);
  padding: 4px;
  height: 36px;
}

.select-token {
  cursor: pointer;
}

.gradient-selector {
  padding: 6px 8px;
  background: linear-gradient(90deg, #2d4a96 0%, #745cd2 100%);
  background-size: 101%;
  background-position: top left -1px;
}

.token-name {
  text-wrap: nowrap;
}

.wallet-balance {
  cursor: pointer;
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 4px;
  color: #575c62;
  font-size: 14px;
  font-weight: 400;
}

.primary-max {
  background: var(
    --Primary-Gradient,
    linear-gradient(90deg, #2d4a96 0%, #745cd2 100%)
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.wallet-icon {
  cursor: pointer;
}

.arrow-icon {
  margin-left: 8px;
}
</style>
