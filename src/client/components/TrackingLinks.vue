<!-- OnlyFans Automation Manager
     File: TrackingLinks.vue
     Purpose: list tracking links
     Created: 2025‑07‑06 – v1.0 -->
<template>
  <div>
    <h3>Tracking Links</h3>
    <ul>
      <li v-for="l in links" :key="l.id">
        {{ l.code }} - {{ l.signups }} signups
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const links = ref([])

onMounted(async () => {
  const res = await fetch('/api/tracking-links')
  if (res.ok) links.value = await res.json()
})
</script>

<!-- End of File – Last modified 2025‑07‑06 -->
