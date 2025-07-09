<!-- OnlyFans Automation Manager
     File: ProfileVisitors.vue
     Purpose: show profile visitor count
     Created: 2025‑07‑06 – v1.0 -->
<template>
  <div class="visitors">Visitors: {{ count }}</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const count = ref(0)

onMounted(async () => {
  const res = await fetch('/api/profile-visitors')
  if (res.ok) {
    const data = await res.json()
    count.value = data.total || 0
  }
})
</script>

<!-- End of File – Last modified 2025‑07‑06 -->
