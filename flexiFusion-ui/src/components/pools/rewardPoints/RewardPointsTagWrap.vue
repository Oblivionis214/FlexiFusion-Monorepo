<template>
  <div class="reward-points-wrap">
    <ElixirRewardTag
      :icon="icon"
      :name="name"
      :multiplier="multiplier"
      :card="card"
      v-if="rewardPointsType === RewardPointsTypes.Elixir"
    />
  </div>
</template>

<script lang="ts">
import { RewardPointsTypes } from "@/configs/pools/types";
import { defineAsyncComponent, type PropType } from "vue";

export default {
  props: {
    rewardPointsType: {
      type: String as PropType<RewardPointsTypes>,
      required: true,
    },
    icon: Boolean,
    name: Boolean,
    multiplier: Boolean,
    card: Boolean,
  },

  data() {
    return { RewardPointsTypes };
  },

  components: {
    ElixirRewardTag: defineAsyncComponent(
      () => import("@/components/pools/rewardPoints/elixir/ElixirRewardTag.vue")
    ),
  },
};
</script>

<style lang="scss" scoped></style>
