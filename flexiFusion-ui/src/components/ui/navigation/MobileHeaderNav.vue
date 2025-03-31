<template>
  <nav>
    <ul class="popup-links">
      <li class="model-factory-wrap" @click="$emit('close-popup')">
        <MobileHeaderLink>
          <img src="@/assets/images/header/dropdown/more/stake-icon.svg" />
          <span>Model Factory</span>
        </MobileHeaderLink>
      </li>

      <li class="agent-wrap" @click="$emit('close-popup')">
        <MobileHeaderLink>
          <img src="@/assets/images/header/dropdown/more/stake-icon.svg" />
          <span>Agent</span>
        </MobileHeaderLink>
      </li>

      <li @click="$emit('close-popup')">
        <MobileHeaderLink href="https://docs.abracadabra.money/learn/">
          <img src="@/assets/images/header/dropdown/more/docs-icon.svg" />
          Documentation
        </MobileHeaderLink>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts">
import { defineAsyncComponent } from "vue";

export default {
  methods: {
    closePopup() {
      this.$emit("close-popup");
    },
  },

  components: {
    MobileHeaderLink: defineAsyncComponent(
      () => import("@/components/ui/links/MobileHeaderLink.vue")
    ),
  },
};
</script>

<style lang="scss" scoped>
.popup-links {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 23px;
  list-style: none;
}

.model-factory-wrap,
.agent-wrap {
  display: flex;
  width: 100%;
}

.stake-wrap {
  display: flex;
  width: 100%;
}

.stake-btn {
  display: flex;
  gap: 6px;
  width: 100%;
  justify-content: space-between;
  align-items: center;
}

.arrow {
  height: 8px;
  width: 8px;
  transform: rotate(-90deg);
  margin-left: auto;
}
</style>
