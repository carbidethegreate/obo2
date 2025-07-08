<!-- OnlyFans Automation Manager
     File: PayoutPulse.vue
     Purpose: show payout balance
     Created: 2025-07-06 – v1.0 -->
<template>
  <div class="payout" :style="style">
    <span>{{ balance }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const balance = ref(0)

onMounted(async () => {
  const res = await fetch('/api/balances')
  if (res.ok) {
    const data = await res.json()
    balance.value = data.payoutAvailable || 0
  }
})

const style = computed(() => ({
  color: balance.value >= 500 ? 'orange' : 'black'
}))
</script>

<!-- End of File – Last modified 2025-07-06 -->
