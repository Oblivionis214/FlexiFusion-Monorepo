<template>
  <div class="cauldrons-page">
    <div class="banner-container">
      <div class="cauldrons-container">
        <div class="text-wrap">
          <h3 class="title">Available Cauldrons</h3>
          <h4 class="subtitle">
            Use your favourite assets as collateral to mint
          </h4>
          <h4 class="subtitle">
            <img
              class="mim-icon"
              src="@/assets/images/PixelMIM.svg"
              alt="Mim icon"
            />
            MIM a leading decentralised and collateral-backed stablecoin.
          </h4>
        </div>

        <!-- <ArbitrumBlock /> -->

        <CauldronsCarousel />

        <CauldronsTable
          :cauldrons="cauldrons"
          :cauldronsLoading="cauldronsLoading"
          :aprsLoading="aprsLoading"
          :tableKeys="tableKeys"
          @openMobileFiltersPopup="openMobileFiltersPopup"
          ref="cauldronsTable"
        />
      </div>
    </div>

    <FiltersPopup
      v-if="isFiltersPopupOpened"
      :sortersData="tableKeys.slice(1)"
      @updateSortKey="updateSortKeys"
      @close="isFiltersPopupOpened = false"
    />
  </div>
</template>

<script lang="ts">
import { defineAsyncComponent } from "vue";
import { mapGetters, mapMutations } from "vuex";
// @ts-ignore
import { getMarketList } from "@/helpers/cauldron/lists/getMarketList";
import type { CauldronListItem } from "@/helpers/cauldron/lists/getMarketList";
import { getMaxLeverageMultiplierAlternative } from "@/helpers/cauldron/getMaxLeverageMultiplier";
import { fetchCauldronsAprs } from "@/helpers/collateralsApy/fetchCauldronsAprs";

type Data = {
  cauldrons: any;
  cauldronsLoading: boolean;
  updateInterval: null | NodeJS.Timeout;
  timerInterval: number;
  isFiltersPopupOpened: boolean;
  tableKeys: any;
  aprs: any;
  aprsLoading: boolean;
};

type AprInfo = { [key: string]: AprInfo };

export default {
  data(): Data {
    return {
      cauldrons: [],
      cauldronsLoading: true,
      aprs: {},
      aprsLoading: true,
      updateInterval: null,
      timerInterval: 60000,
      isFiltersPopupOpened: false,
      tableKeys: [
        {
          tableKey: "Collateral",
        },
        {
          tableKey: "TVL",
          tooltip: "Total Value Locked.",
          isSortingCriterion: true,
        },
        {
          tableKey: "TMB",
          tooltip: "Total MIM Borrowed.",
          isSortingCriterion: true,
        },
        {
          tableKey: "MIMS LB",
          tooltip: "MIMs left to be Borrowed.",
          isSortingCriterion: true,
        },
        {
          tableKey: "Interest",
          tooltip: "Annualised percent that your debt will increase each year.",
          isSortingCriterion: true,
        },
        {
          tableKey: "APR",
          tooltip: "Annualised Percentage Return Range.",
          isSortingCriterion: true,
        },
      ],
    };
  },

  computed: {
    ...mapGetters({
      account: "getAccount",
      localCauldronsList: "getCauldronsList",
    }),
  },

  watch: {
    async account() {
      await this.createCaulldronsInfo();
    },
  },

  methods: {
    ...mapMutations({
      setCauldronsList: "setCauldronsList",
    }),

    async getCollateralsApr(
      cauldrons: CauldronListItem[]
    ): Promise<CauldronListItem[]> {
      this.aprsLoading = true;
      this.aprs = await fetchCauldronsAprs(cauldrons);

      return cauldrons.map((cauldron: CauldronListItem) => {
        const apr =
          this.aprs![
            cauldron.config.contract.address.toLowerCase() as keyof typeof this.aprs
          ];

        const multiplier = getMaxLeverageMultiplierAlternative(cauldron, true);

        cauldron.apr = apr
          ? {
              value: apr,
              multiplier,
            }
          : { value: 0, multiplier: 0 };
        return cauldron;
      });
    },

    openMobileFiltersPopup(): void {
      this.isFiltersPopupOpened = true;
    },

    updateSortKeys(key: any, order: any): void {
      (this.$refs.cauldronsTable as any).updateSortKeys(key, order);
    },

    checkLocalData(): void {
      if (this.localCauldronsList.isCreated) {
        this.cauldrons = this.localCauldronsList.data;
        this.cauldronsLoading = false;
      }
    },

    async createCaulldronsInfo(): Promise<void> {
      const cauldrons = await getMarketList(this.account);

      this.cauldrons = await this.getCollateralsApr(cauldrons);

      this.cauldronsLoading = false;
      this.aprsLoading = false;
      this.setCauldronsList(this.cauldrons);
    },
  },

  async created() {
    this.checkLocalData();
    await this.createCaulldronsInfo();

    this.updateInterval = setInterval(async () => {
      await this.createCaulldronsInfo();
      console.log("update cauldrons");
    }, this.timerInterval);
  },

  beforeUnmount() {
    clearInterval(this.updateInterval as any);
  },

  components: {
    // ArbitrumBlock: defineAsyncComponent(
    //   () => import("@/components/cauldrons/ArbitrumBlock.vue")
    // ),
    CauldronsCarousel: defineAsyncComponent(
      // @ts-ignore
      () => import("@/components/ui/carousel/CauldronsCarousel.vue")
    ),
    CauldronsTable: defineAsyncComponent(
      // @ts-ignore
      () => import("@/components/cauldrons/CauldronsTable.vue")
    ),
    FiltersPopup: defineAsyncComponent(
      () => import("@/components/myPositions/FiltersPopup.vue")
    ),
  },
};
</script>

<style lang="scss" scoped>
.cauldrons-page {
  min-height: 100vh;
  width: 100%;
  height: 100%;
}

.banner-container {
  position: relative;
  max-width: 1500px;
  width: 100%;
  margin: 0 auto;
}

.cauldrons-container {
  padding: 125px 15px 100px;
  max-width: 1310px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.title {
  font-size: 32px;
  font-weight: 600;
  line-height: 150%;
}

.subtitle {
  display: flex;
  gap: 4px;
  align-items: center;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
  line-height: 150%;
}

.mim-icon {
  width: 24px;
  height: 24px;
}

@media screen and (max-width: 768px) {
  .cauldrons-container {
    padding: 100px 12px 60px;
    gap: 16px;
  }
}

@media screen and (max-width: 600px) {
  .title {
    font-size: 24px;
  }

  .subtitle {
    align-items: flex-start;
    font-size: 14px;
  }

  .mim-icon {
    width: 16px;
    height: 16px;
  }
}
</style>
