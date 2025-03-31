<template>
  <HeaderLink to="Pools">Pools</HeaderLink>
  <HeaderLink>Model Factory</HeaderLink>
  <HeaderLink>Agent</HeaderLink>
  <HeaderMoreDropdown />
</template>

<script>
import { defineAsyncComponent } from "vue";

export default {
  components: {
    HeaderLink: defineAsyncComponent(() =>
      import("@/components/ui/links/HeaderLink.vue")
    ),
    HeaderMoreDropdown: defineAsyncComponent(() =>
      import("@/components/ui/dropdown/HeaderMoreDropdown.vue")
    ),
  },
};
</script>

<style lang="scss" scoped></style>
