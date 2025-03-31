<template>
  <header class="header">
    <router-link
      class="logo-wrap"
      :to="{ name: isClassicHeader ? 'Home' : 'Swap' }"
    >
      <component
        :is="isClassicHeader ? 'MainLogoIcon' : 'SwapLogoIcon'"
        :width="isClassicHeader ? 42 : 52"
        :height="42"
      />
    </router-link>

    <nav class="nav">
      <component :is="isClassicHeader ? 'HeaderNav' : 'SwapHeaderNav'" />

      <div class="line"></div>

      <SwapLink :isClassicHeader="isClassicHeader" />
    </nav>

    <div class="user-actions">
      <ChainButton />
      <ConnectButton class="connect-button" />
    </div>

    <BurgerButton />
  </header>
</template>

<script>
import { mapGetters } from "vuex";
import { defineAsyncComponent } from "vue";

export default {
  data() {
    return {
      alternativeHeader: [
        "Swap",
      ],
      exception: ["Blast", "PointsDashboard"],
      isClassicHeader: true,
    };
  },

  computed: {
    ...mapGetters({
      account: "getAccount",
    }),
  },

  watch: {
    $route() {
      if (!this.exception.includes(this.$route.name)) {
        this.checkTypeHeader();
      }
    },
  },

  methods: {
    checkTypeHeader() {
      this.isClassicHeader = !this.alternativeHeader.includes(this.$route.name);
    },
  },

  components: {
    MainLogoIcon: defineAsyncComponent(() =>
      import("@/components/ui/icons/MainLogoIcon.vue")
    ),
    SwapLogoIcon: defineAsyncComponent(() =>
      import("@/components/ui/icons/SwapLogoIcon.vue")
    ),
    HeaderNav: defineAsyncComponent(() =>
      import("@/components/ui/navigation/HeaderNav.vue")
    ),
    SwapHeaderNav: defineAsyncComponent(() =>
      import("@/components/ui/navigation/SwapHeaderNav.vue")
    ),
    SwapLink: defineAsyncComponent(() =>
      import("@/components/ui/links/SwapLink.vue")
    ),
    ChainButton: defineAsyncComponent(() =>
      import("@/components/ui/buttons/ChainButton.vue")
    ),
    ConnectButton: defineAsyncComponent(() =>
      import("@/components/ui/buttons/ConnectButton.vue")
    ),
    BurgerButton: defineAsyncComponent(() =>
      import("@/components/ui/buttons/BurgerButton.vue")
    ),
  },
};
</script>

<style lang="scss" scoped>
.header {
  position: absolute;
  top: 28px;
  left: 0;
  right: 0;
  max-width: 1310px;
  padding: 0 15px;
  margin: 0 auto;
  z-index: 101;
  gap: 12px;
  display: flex;
  align-items: center;
}

.logo-wrap {
  margin-right: 14px;
}

.nav {
  flex: 1;
  gap: 12px;
  display: flex;
  align-items: center;
}

.line {
  height: 46px;
  width: 1px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 46.5%,
    rgba(255, 255, 255, 0) 100%
  );
}

.user-actions {
  gap: 16px;
  display: flex;
  align-items: center;
  z-index: 0;
}

@media (max-width: 1200px) {
  .nav {
    display: none;
  }

  .user-actions {
    margin-left: auto;

    &::v-deep(.chain-button) {
      display: none;
    }
  }

  .connect-button::v-deep(.btn-text) {
    display: none;
  }
}

@media (max-width: 600px) {
  .logo-wrap {
    margin-right: 0;
  }

  .nav {
    width: 0;
  }
}
</style>
