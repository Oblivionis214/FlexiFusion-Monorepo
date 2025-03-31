<template>
  <div class="pool-action-block">
    <div class="inputs-wrap">
      <BaseTokenInput
        class="base-input"
        :name="baseToken.config.name"
        :icon="baseToken.config.icon"
        :decimals="baseToken.config.decimals"
        :max="baseToken.userInfo.balance"
        :value="baseInputValue"
        :tokenPrice="baseToken.price"
        @updateInputValue="updateValue($event, true)"
      />

      <BaseTokenInput
        class="quote-input"
        :name="quoteToken.config.name"
        :icon="quoteToken.config.icon"
        :decimals="quoteToken.config.decimals"
        :max="quoteToken.userInfo.balance"
        :value="quoteInputValue"
        :tokenPrice="quoteToken.price"
        @updateInputValue="updateValue($event)"
      />

      <IconButton
        class="plus-icon"
        plus
        active
        disable
        :width="44"
        :height="44"
        borderRadius="16px"
      />
    </div>

    <RewardPointsBannerWrap
      :rewardPointsType="rewardPointsType"
      v-if="rewardPointsType"
    />

    <div class="info-blocks">
      <div class="info-block lp">
        <div class="tag">
          <div class="pool-info">
            <BaseTokenIcon :name="pool.name" :icon="pool.icon" size="32px" />
            <div>
              <div class="pool-name">{{ pool.name }}</div>
              <div class="pool-slippage">Slippage included</div>
            </div>
          </div>

          <div class="token-amount">
            <span class="value"> {{ formattedLpTokenExpected.value }} </span>
            <span class="usd"> {{ formattedLpTokenExpected.usd }} </span>
          </div>
        </div>
      </div>
    </div>

    <BaseButton primary @click="handleAction" :disabled="isButtonDisabled">
      {{ buttonText }}
    </BaseButton>

    <PreviewAddLiquidityPopup
      v-if="isPreviewPopupOpened"
      :pool="pool"
      :previewInfo="previewPopupInfo"
      :isActionProcessing="isActionProcessing"
      :transactionStatus="transactionStatus"
      @approve="approveHandler"
      @deposit="depositHandler"
      @close="closePreviewPopup"
    />
  </div>
</template>

<script>
import moment from "moment";
import { defineAsyncComponent } from "vue";
import { mapActions, mapGetters, mapMutations } from "vuex";
import { formatUnits, parseUnits } from "viem";
import { notificationErrorMsg } from "@/helpers/notification/notificationError.js";
import notification from "@/helpers/notification/notification";
import { approveTokenViem } from "@/helpers/approval";
import { trimZeroDecimals } from "@/helpers/numbers";
import { previewAddLiquidity } from "@/helpers/pools/swap/liquidity";
import { addLiquidity } from "@/helpers/pools/swap/actions/addLiquidity";
import { formatTokenBalance, formatUSD } from "@/helpers/filters";
import { applySlippageToMinOutBigInt } from "@/helpers/gm/applySlippageToMinOut";
import { switchNetwork } from "@/helpers/chains/switchNetwork";
import { actionStatus } from "@/components/pools/pool/PoolActionBlock.vue";
import { simulateContractHelper, writeContractHelper, waitForTransactionReceiptHelper } from "@/helpers/contracts/contractHelpers";
import { CPMMDEXModule } from "@/constants/contracts/CPMMDEXModule";
import { FlexiFusionLiquidityModule } from "@/constants/contracts/FlexiFusionLiquidityModule";

export default {
  props: {
    pool: { type: Object },
    slippage: { type: BigInt, default: 100n },
    deadline: { type: BigInt, default: 100n },
  },

  emits: ["updatePoolInfo"],

  data() {
    return {
      baseInputAmount: 0n,
      baseInputValue: "",
      quoteInputAmount: 0n,
      quoteInputValue: "",
      isActionProcessing: false,
      transactionStatus: actionStatus.WAITING,
      isPreviewPopupOpened: false,
    };
  },

  computed: {
    ...mapGetters({
      chainId: "getChainId",
      account: "getAccount",
    }),

    baseToken() {
      return this.pool.tokens.baseToken;
    },
    quoteToken() {
      return this.pool.tokens.quoteToken;
    },

    previewAddLiquidityResult() {
      const previewAddLiquidityResult = previewAddLiquidity(
        this.baseInputAmount,
        this.quoteInputAmount,
        this.pool
      );

      previewAddLiquidityResult.shares = applySlippageToMinOutBigInt(
        this.slippage,
        previewAddLiquidityResult.shares
      );

      return previewAddLiquidityResult;
    },

    previewPopupInfo() {
      return {
        lpAmount: this.previewAddLiquidityResult.shares,
        baseTokenAmount: this.previewAddLiquidityResult.baseAdjustedInAmount,
        quoteTokenAmount: this.previewAddLiquidityResult.quoteAdjustedInAmount,
      };
    },

    formattedLpTokenExpected() {
      if (!this.previewAddLiquidityResult)
        return { value: "0.0", usd: "$ 0.0" };

      const formattedLpTokenValue = Number(
        formatUnits(this.previewAddLiquidityResult.shares, this.pool.decimals)
      );

      const lpTokenValueUsdEquivalent = formattedLpTokenValue * this.pool.price;

      return {
        value: formatTokenBalance(formattedLpTokenValue),
        usd: formatUSD(lpTokenValueUsdEquivalent),
      };
    },

    isValid() {
      return !!this.baseInputAmount && !!this.quoteInputAmount;
    },

    error() {
      if (this.baseInputAmount > this.baseToken.userInfo?.balance)
        return `Insufficient ${this.baseToken.config.name} balance`;

      if (this.quoteInputAmount > this.quoteToken.userInfo?.balance)
        return `Insufficient ${this.quoteToken.config.name} balance`;

      return null;
    },

    buttonText() {
      if (!this.isProperNetwork) return "Switch network";
      if (!this.account) return "Connect wallet";
      if (this.error) return this.error;
      if (this.baseInputValue == "" || this.quoteInputValue == "")
        return `Enter amount`;

      if (this.isActionProcessing) return "Processing...";

      return "Deposit";
    },

    isButtonDisabled() {
      return (
        (!this.isValid || !!this.error || this.isActionProcessing) &&
        this.isProperNetwork &&
        !!this.account
      );
    },

    isProperNetwork() {
      return this.chainId == this.pool.chainId;
    },

    rewardPointsType() {
      const currentRewardPointsType =
        this.pool.config.settings.rewardPointsType;
      const hasStakeContract = !!this.pool.config.stakeContract;
      return hasStakeContract ? "" : currentRewardPointsType;
    },

    isBaseTokenApproved() {
      return this.baseToken.approved;
    },

    isQuoteTokenApproved() {
      return this.quoteToken.approved;
    },
  },

  methods: {
    ...mapActions({ createNotification: "notifications/new" }),
    ...mapMutations({ deleteNotification: "notifications/delete" }),

    formatUSD,

    clearData() {
      this.baseInputAmount = 0n;
      this.quoteInputAmount = 0n;
      this.baseInputValue = "";
      this.quoteInputValue = "";
    },

    closePreviewPopup() {
      this.isPreviewPopupOpened = false;
      this.isActionProcessing = false;
      this.transactionStatus = actionStatus.WAITING;
    },

    updateTokenInputs(adjustmendResults) {
      this.baseInputAmount = adjustmendResults.baseAdjustedInAmount;
      this.quoteInputAmount = adjustmendResults.quoteAdjustedInAmount;
      this.quoteInputValue = trimZeroDecimals(
        formatUnits(
          adjustmendResults.quoteAdjustedInAmount,
          this.quoteToken.config.decimals
        )
      );
      this.baseInputValue = trimZeroDecimals(
        formatUnits(
          adjustmendResults.baseAdjustedInAmount,
          this.baseToken.config.decimals
        )
      );
    },

    updateValue(value, fromBase = false) {
      if (value === null) {
        this.clearData();
        return false;
      }

      const otherTokenCurrentAmount = fromBase
        ? this.quoteInputAmount
        : this.baseInputAmount;

      const adjustmendResults = this.calculateAdjustmentAmounts(
        value,
        otherTokenCurrentAmount,
        fromBase
      );

      this.updateTokenInputs(adjustmendResults);
    },

    createDepositPayload() {
      const { baseAdjustedInAmount, quoteAdjustedInAmount, shares } =
        this.previewAddLiquidityResult;
      const deadline = moment().unix() + Number(this.deadline);

      return {
        lp: this.pool?.contract?.address,
        to: this.account,
        baseInAmount: baseAdjustedInAmount,
        quoteInAmount: quoteAdjustedInAmount,
        minimumShares: shares,
        deadline,
      };
    },

    async approveHandler(token, valueToApprove) {
      this.isActionProcessing = true;
      const notificationId = await this.createNotification(
        notification.approvePending
      );

      try {
        console.log("开始授权token...");
        console.log("授权参数:", {
          token: token.config.name,
          spender: this.pool.liquidityModule,
          amount: valueToApprove.toString()
        });

        await approveTokenViem(
          token.config.contract,
          this.pool.liquidityModule,
          valueToApprove
        );
        
        console.log("token授权成功");
        await this.$emit("updatePoolInfo");

        await this.deleteNotification(notificationId);
      } catch (error) {
        console.log("token授权失败:", error);

        const errorNotification = {
          msg: await notificationErrorMsg(error),
          type: "error",
        };

        await this.deleteNotification(notificationId);
        await this.createNotification(errorNotification);
      }
      this.isActionProcessing = false;
    },

    async depositHandler() {
      // this.isActionProcessing = true;
      // this.transactionStatus = "pending";
      // const notificationId = await this.createNotification(
      //   notification.pending
      // );

      // try {
      //   const payload = this.createDepositPayload();
      //   const { error, result } = await addLiquidity(
      //     this.pool?.swapRouter,
      //     payload
      //   );
      //   this.transactionStatus = "success";
      //   await this.$emit("updatePoolInfo");
      //   await this.deleteNotification(notificationId);

      //   await this.createNotification(notification.success);
      //   this.clearData();
      // } catch (error) {
      //   this.transactionStatus = "error";
      //   console.log("add liquidity err:", error);

      //   const errorNotification = {
      //     msg: await notificationErrorMsg(error),
      //     type: "error",
      //   };

      //   await this.deleteNotification(notificationId);
      //   await this.createNotification(errorNotification);
      // }
      // this.isActionProcessing = false;
    },

    async swapHandler() {
      this.isActionProcessing = true;
      this.transactionStatus = "pending";
      const notificationId = await this.createNotification(
        notification.pending
      );

      try {
        const deadline = moment().unix() + Number(this.deadline);
        const { request } = await simulateContractHelper({
          address: this.pool.swapRouter,
          abi: CPMMDEXModule,
          functionName: "swap",
          args: [
            this.account,
            this.baseInputAmount,
            this.quoteInputAmount,
            0n,
            0n
          ],
        });

        const hash = await writeContractHelper(request);
        await waitForTransactionReceiptHelper({ hash });
        
        this.transactionStatus = "success";
        await this.$emit("updatePoolInfo");
        await this.deleteNotification(notificationId);
        await this.createNotification(notification.success);
        this.clearData();
      } catch (error) {
        this.transactionStatus = "error";
        console.log("swap err:", error);

        const errorNotification = {
          msg: await notificationErrorMsg(error),
          type: "error",
        };

        await this.deleteNotification(notificationId);
        await this.createNotification(errorNotification);
      }
      this.isActionProcessing = false;
    },

    async handleAction() {
      console.log("handleAction被触发");
      console.log("按钮状态:", {
        isButtonDisabled: this.isButtonDisabled,
        isActionProcessing: this.isActionProcessing,
        isValid: this.isValid,
        error: this.error,
        isProperNetwork: this.isProperNetwork,
        account: this.account
      });

      if (this.isButtonDisabled) {
        console.log("按钮被禁用,返回");
        return false;
      }
      if (!this.isProperNetwork) {
        console.log("网络不正确,切换网络");
        return switchNetwork(this.pool.chainId);
      }
      if (!this.account) {
        console.log("钱包未连接,打开Web3Modal");
        // @ts-ignore
        return this.$openWeb3modal();
      }

      console.log("开始执行handleAction...");
      console.log("当前状态:", {
        isBaseTokenApproved: this.isBaseTokenApproved,
        isQuoteTokenApproved: this.isQuoteTokenApproved,
        baseInputAmount: this.baseInputAmount.toString(),
        quoteInputAmount: this.quoteInputAmount.toString(),
        liquidityModule: this.pool.liquidityModule
      });

      try {
        // 检查token授权
        if (!this.isBaseTokenApproved || !this.isQuoteTokenApproved) {
          console.log("需要授权token");
          console.log("baseToken授权状态:", this.isBaseTokenApproved);
          console.log("quoteToken授权状态:", this.isQuoteTokenApproved);
          console.log("授权目标地址(liquidityModule):", this.pool.liquidityModule);
          
          if (!this.isBaseTokenApproved) {
            await this.approveHandler(this.baseToken, this.baseInputAmount);
          }
          if (!this.isQuoteTokenApproved) {
            await this.approveHandler(this.quoteToken, this.quoteInputAmount);
          }
          return;
        }

        // 设置处理状态
        this.isActionProcessing = true;
        this.transactionStatus = "pending";
        const notificationId = await this.createNotification(notification.pending);

        try {
          // 执行deposit
          console.log("开始执行deposit...");
          console.log("deposit参数:", {
            to: this.account,
            baseInputAmount: this.baseInputAmount.toString(),
            quoteInputAmount: this.quoteInputAmount.toString(),
            liquidityModule: this.pool.liquidityModule
          });

          const { request } = await simulateContractHelper({
            address: this.pool.liquidityModule,
            abi: FlexiFusionLiquidityModule,
            functionName: "deposit",
            args: [
              this.account,
              this.baseInputAmount,
              this.quoteInputAmount,
            ],
          });

          const hash = await writeContractHelper(request);
          console.log("deposit交易已发送,hash:", hash);
          
          await waitForTransactionReceiptHelper({ hash });
          console.log("deposit交易已完成");

          // 执行swap
          console.log("开始执行swap...");
          console.log("swap参数:", {
            to: this.account,
            baseInputAmount: this.baseInputAmount.toString(),
            quoteInputAmount: this.quoteInputAmount.toString(),
            token0OutMin: "0",
            token1OutMin: "0",
            swapRouter: this.pool.swapRouter
          });

          const { request: swapRequest } = await simulateContractHelper({
            address: this.pool.swapRouter,
            abi: CPMMDEXModule,
            functionName: "swap",
            args: [
              this.account,
              this.baseInputAmount,
              this.quoteInputAmount,
              0n,
              0n
            ],
          });

          const swapHash = await writeContractHelper(swapRequest);
          console.log("swap交易已发送,hash:", swapHash);
          
          await waitForTransactionReceiptHelper({ hash: swapHash });
          console.log("swap交易已完成");
          
          // 所有操作完成后更新状态
          this.transactionStatus = "success";
          await this.$emit("updatePoolInfo");
          await this.deleteNotification(notificationId);
          await this.createNotification(notification.success);
          this.clearData();
        } catch (error) {
          this.transactionStatus = "error";
          console.log("deposit或swap执行出错:", error);

          const errorNotification = {
            msg: await notificationErrorMsg(error),
            type: "error",
          };

          await this.deleteNotification(notificationId);
          await this.createNotification(errorNotification);
          throw error; // 重新抛出错误以确保外层catch能捕获
        }
      } catch (error) {
        console.error("操作失败:", error);
      } finally {
        // 确保在所有操作（包括deposit和swap）完成后才重置状态
        this.isActionProcessing = false;
      }
    },

    formatTokenBalance(value, decimals) {
      return formatTokenBalance(formatUnits(value, decimals));
    },

    calculateAdjustmentAmounts(
      fromTokenAmount,
      currentToTokenAmount = 0n,
      fromBase = false
    ) {
      if (currentToTokenAmount !== 0n) {
        const baseTokenAmount = fromBase
          ? fromTokenAmount
          : currentToTokenAmount;
        const quoteTokenAmount = fromBase
          ? currentToTokenAmount
          : fromTokenAmount;
        const initialResults = previewAddLiquidity(
          baseTokenAmount,
          quoteTokenAmount,
          this.pool
        );

        if (
          initialResults.baseAdjustedInAmount === baseTokenAmount &&
          initialResults.quoteAdjustedInAmount === quoteTokenAmount
        ) {
          return initialResults;
        }
      }

      const deviationFactor = 120n;
      const ratePresicion = parseUnits("1", 18);

      const fromToken = {
        tokenReserve: fromBase
          ? this.pool.vaultReserve[0]
          : this.pool.vaultReserve[1],
        tokenInfo: fromBase ? this.baseToken : this.quoteToken,
      };

      const toToken = {
        tokenReserve: fromBase
          ? this.pool.vaultReserve[1]
          : this.pool.vaultReserve[0],
        tokenInfo: fromBase ? this.quoteToken : this.baseToken,
      };

      const fromTokenPrice = fromToken.tokenInfo.price;
      const toTokenPrice = toToken.tokenInfo.price;

      const fromTokenValue =
        fromToken.tokenReserve * parseUnits(fromTokenPrice.toString(), 18);

      const toTokenValue =
        toToken.tokenReserve * parseUnits(toTokenPrice.toString(), 18);
      const rate = (fromTokenValue * ratePresicion) / toTokenValue;

      const toTokenAmount = (fromTokenAmount * ratePresicion) / rate;

      const toTokenUpdated = fromBase
        ? (toTokenAmount * deviationFactor) / 100n
        : (toTokenAmount * deviationFactor) / 100n;

      const baseTokenAmount = fromBase ? fromTokenAmount : toTokenUpdated;
      const quoteTokenAmount = fromBase ? toTokenUpdated : fromTokenAmount;

      const previewAddLiquidityResults = previewAddLiquidity(
        baseTokenAmount,
        quoteTokenAmount,
        this.pool
      );

      return previewAddLiquidityResults;
    },
  },

  components: {
    BaseTokenInput: defineAsyncComponent(() =>
      import("@/components/base/BaseTokenInput.vue")
    ),
    BaseTokenIcon: defineAsyncComponent(() =>
      import("@/components/base/BaseTokenIcon.vue")
    ),
    BaseButton: defineAsyncComponent(() =>
      import("@/components/base/BaseButton.vue")
    ),
    IconButton: defineAsyncComponent(() =>
      import("@/components/ui/buttons/IconButton.vue")
    ),
    PreviewAddLiquidityPopup: defineAsyncComponent(() =>
      import("@/components/pools/pool/popups/PreviewAddLiquidityPopup.vue")
    ),
    RewardPointsBannerWrap: defineAsyncComponent(() =>
      import("@/components/pools/rewardPoints/RewardPointsBannerWrap.vue")
    ),
    // CurrentPrice: defineAsyncComponent(() =>
    //   import("@/components/pools/CurrentPrice.vue")
    // ),
  },
};
</script>

<style lang="scss" scoped>
.pool-action-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
}

.inputs-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.plus-icon {
  position: absolute;
  top: calc(50% - 28px);
  left: calc(50% - 28px);
  width: 46px;
  height: 46px;
}

.info-blocks {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 24px;
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(180, 180, 180, 0.08);
  background: linear-gradient(
    146deg,
    rgba(0, 10, 35, 0.07) 0%,
    rgba(0, 80, 156, 0.07) 101.49%
  );
  box-shadow: 0px 4px 33px 0px rgba(0, 0, 0, 0.06);
}

.tag {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  color: #878b93;
  font-size: 16px;
  font-weight: 500;
}

.pool-info {
  display: flex;
  align-items: center;
}

.pool-name {
  color: #fff;
}

.pool-slippage {
  color: #878b93;
  font-size: 14px;
  font-weight: 500;
}

.token-amount {
  display: flex;
  flex-direction: column;
  align-items: end;
}

.value {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}

.value {
  display: flex;
  align-items: center;
}

.apr {
  color: #fff;
  text-shadow: 0px 0px 16px #ab5de8;
  font-size: 16px;
  font-weight: 600;
}

.usd-equivalent {
  color: #575c62;
  font-size: 16px;
  font-weight: 400;
}
</style>
