<!-- OnlyFans Automation Manager
     File: PayoutPulse.vue
     Purpose: show payout balance (User Story B-5)
     Created: 2025-07-06 – v1.0 -->
<template>
  <div class="payout" :style="style">
    <span v-if="loading">Loading...</span>
    <span v-else-if="error">Error</span>
    <span v-else>{{ balance }}</span>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useQuery, gql } from '@apollo/client/core'

const { result, loading, error } = useQuery(gql`query Balances { balances }`)
const balance = computed(() => result.value?.balances || 0)
const style = computed(() => ({ color: balance.value >= 500 ? 'orange' : 'black' }))
</script>

<!-- End of File – Last modified 2025-07-11 -->
