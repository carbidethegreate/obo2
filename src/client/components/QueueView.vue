<!-- OnlyFans Automation Manager
     File: QueueView.vue
     Purpose: list future posts
     Created: 2025‑07‑06 – v1.0 -->
<template>
  <div class="queue-view">
    <h2>Scheduled Items</h2>
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.type }} - {{ item.publish_at }}
        <button @click="publish(item.id)">Publish Now</button>
      </li>
    </ul>
    <div v-if="loading">Loading...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const items = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  const res = await fetch('/api/queue')
  if (res.ok) {
    const data = await res.json()
    items.value = data.data || []
  }
  loading.value = false
}

async function publish(id) {
  await fetch(`/api/queue/${id}`, { method: 'PUT' })
  items.value = items.value.filter(i => i.id !== id)
}

onMounted(load)
</script>

<!-- End of File – Last modified 2025‑07‑06 -->