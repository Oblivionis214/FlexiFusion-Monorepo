<template>
  <img
    src="@/assets/images/logo-new.png"
    :style="`width: ${width}px; height: ${height}px;`"
    :class="{ pointer: pointer }"
    alt="Logo"
  />
</template>

<script>
export default {
  props: {
    width: {
      type: Number,
      default: 48,
    },
    height: {
      type: Number,
      default: 48,
    },
    pointer: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style lang="scss" scoped>
img {
  transition: all 0.3s ease;
  object-fit: contain;
}

.pointer {
  cursor: pointer;
}
</style>
