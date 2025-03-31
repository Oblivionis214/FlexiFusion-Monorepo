<template>
  <div
    class="pool-card-item"
    :class="{ 'pool-card-item--new': pool.isNew }"
    @click="$router.push(goToPage)"
  >
    <div class="pool-card-item__header">
      <div class="pool-card-item__header-left">
        <div class="pool-card-item__icons">
          <img :src="pool.baseToken.icon" alt="Base Token" />
          <img :src="pool.quoteToken.icon" alt="Quote Token" />
        </div>
        <div class="pool-card-item__name">{{ pool.name }}</div>
      </div>
      <div class="pool-card-item__header-right">
        <div v-if="pool.isNew" class="pool-card-item__new-tag">New</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    pool: {
      type: Object,
      required: true
    }
  },
  computed: {
    goToPage() {
      // 如果池子名称包含 Swap,跳转到 swap 页面
      if (this.pool.name.includes('Swap')) {
        return {
          name: "Swap",
          params: {
            baseToken: this.pool.baseToken.contract.address,
            quoteToken: this.pool.quoteToken.contract.address
          }
        };
      }
      // 其他池子保持原有跳转逻辑
      return {
        name: "Pool",
        params: {
          poolChainId: this.pool.chainId,
          id: this.pool.id,
        },
      };
    }
  }
};
</script>

<style scoped>
.pool-card-item {
  background: var(--color-background-secondary);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pool-card-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.pool-card-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pool-card-item__header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pool-card-item__icons {
  display: flex;
  align-items: center;
}

.pool-card-item__icons img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.pool-card-item__icons img:not(:first-child) {
  margin-left: -8px;
}

.pool-card-item__name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.pool-card-item__new-tag {
  background: var(--color-primary);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
</style> 