<template>
  <AppHeader />
  <div class="router-wrap" :style="pageBackground">
    <img
      class="mim-top-bg"
      src="@/assets/images/main-mim-top-bg.png"
      alt="Mim"
    />
    <img
      class="mim-bottom-bg"
      src="@/assets/images/main-mim-bottom-bg.png"
      alt="Mim"
    />
    <router-view v-slot="{ Component, route }">
      <TransitionGroup
        @before-enter="beforeEnter"
        @enter="enter"
        @leave="leave"
      >
        <div :key="route.fullPath">
          <component :is="Component" />
        </div>
      </TransitionGroup>
    </router-view>
  </div>
  <NotificationContainer />
  <PopupsWrapper />
</template>

<script>
import { defineAsyncComponent } from "vue";
import { useAnimation } from "@/helpers/useAnimation/useAnimation";

export default {
  data() {
    return {
      pageBackground: {
        background: "#101622",
      },
    };
  },

  methods: {
    ...useAnimation("fade"),
  },

  components: {
    AppHeader: defineAsyncComponent(() =>
      import("@/components/app/AppHeader.vue")
    ),
    NotificationContainer: defineAsyncComponent(() =>
      import("@/components/notifications/NotificationContainer.vue")
    ),
    PopupsWrapper: defineAsyncComponent(() =>
      import("@/components/popups/PopupsWrapper.vue")
    ),
  },
};
</script>

<style lang="scss" src="@/assets/styles/main.scss"></style>
