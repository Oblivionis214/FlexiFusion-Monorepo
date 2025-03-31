<template>
  <div class="flexi-fusion-example">
    <h2>FlexiFusion Contract Example</h2>
    
    <!-- Swap Section -->
    <div class="section">
      <h3>Swap</h3>
      <div class="input-group">
        <input v-model="token0InAmount" type="number" placeholder="Token 0 Amount" />
        <input v-model="token1InAmount" type="number" placeholder="Token 1 Amount" />
        <input v-model="token0OutMin" type="number" placeholder="Token 0 Min Out" />
        <input v-model="token1OutMin" type="number" placeholder="Token 1 Min Out" />
      </div>
      <button @click="handleSwap" :disabled="isLoading">Swap</button>
    </div>

    <!-- Liquidity Section -->
    <div class="section">
      <h3>Liquidity</h3>
      <div class="input-group">
        <input v-model="liquidityAmount" type="number" placeholder="Liquidity Amount" />
      </div>
      <button @click="handleRemoveLiquidity" :disabled="isLoading">Remove Liquidity</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getFlexiFusionContract } from '@/helpers/flexiFusion/getContract';
import { notificationErrorMsg } from '@/helpers/notification/notificationError';

const isLoading = ref(false);
const token0InAmount = ref('');
const token1InAmount = ref('');
const token0OutMin = ref('');
const token1OutMin = ref('');
const liquidityAmount = ref('');

const handleSwap = async () => {
  try {
    isLoading.value = true;
    const { dexModule } = getFlexiFusionContract();
    
    await dexModule.write.swap({
      to: '0x...', // Replace with actual address
      token0InAmt: BigInt(token0InAmount.value),
      token1InAmt: BigInt(token1InAmount.value),
      token0OutMin: BigInt(token0OutMin.value),
      token1OutMin: BigInt(token1OutMin.value),
    });
  } catch (error) {
    notificationErrorMsg(error);
  } finally {
    isLoading.value = false;
  }
};

const handleRemoveLiquidity = async () => {
  try {
    isLoading.value = true;
    const { dexModule } = getFlexiFusionContract();
    
    await dexModule.write.removeLiquidity({
      to: '0x...', // Replace with actual address
      liquidity: BigInt(liquidityAmount.value),
    });
  } catch (error) {
    notificationErrorMsg(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.flexi-fusion-example {
  padding: 20px;
}

.section {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style> 