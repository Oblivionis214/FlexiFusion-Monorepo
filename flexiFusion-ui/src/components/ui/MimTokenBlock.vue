<template>
  <div class="mim-wrap">
    <button
      class="token-btn"
      @click="addToken"
      :class="{ disabled: !this.account }"
    >
      <img src="@/assets/images/PixelMIM.svg" alt="MIM" />
    </button>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import tokensInfo from "@/configs/tokens/mim";

export default {
  data() {
    return {
      contract: null,
    };
  },

  computed: {
    ...mapGetters({
      chainId: "getChainId",
      account: "getAccount",
    }),

    mimInfo() {
      let id = 1;

      if (this.chainId) id = this.chainId;

      return tokensInfo.find((token) => token.chainId === id);
    },
  },

  methods: {
    async addToken() {
      if (!this.account) {
        return false;
      }

      const { ethereum } = window;

      try {
        // wasAdded is a boolean. Like any RPC method, an error may be thrown.
        const wasAdded = await ethereum.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20", // Initially only supports ERC20, but eventually more!
            options: {
              address: this.mimInfo.address, // The address that the token is at.
              symbol: this.mimInfo.symbol, // A ticker symbol or shorthand, up to 5 chars.
              decimals: this.mimInfo.decimals, // The number of decimals in the token
              image: this.mimInfo.image, // A string url of the token logo
            },
          },
        });

        if (wasAdded) {
          console.log("Thanks for your interest!");
        } else {
          console.log("Your loss!");
        }
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style lang="scss">
.mim-wrap {
  display: flex;
  align-items: center;
}

.token-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  cursor: pointer;

  img {
    max-width: 100%;
    height: auto;
  }
}

.disabled {
  cursor: initial;
}
</style>
