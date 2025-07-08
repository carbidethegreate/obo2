<!-- OnlyFans Automation Manager
     File: LtvCard.vue
     Purpose: display top lifetime value fans
     Created: 2025‑07‑06 – v1.0 -->
<template>
  <div class="ltv-card">
    <h2>Top Fans</h2>
    <ul>
      <li v-for="fan in fans" :key="fan.fan_id">
        {{ fan.display_name }} - ${{ fan.lifetime_value }}
      </li>
    </ul>
    <div v-if="loading">Loading...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const fans = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  const res = await fetch('/api/ltv')
  if (res.ok) {
    const data = await res.json()
    fans.value = data.rows || []
  }
  loading.value = false
}

onMounted(load)
</script>

<!-- End of File – Last modified 2025‑07‑06 -->
