<!-- OnlyFans Automation Manager
     File: ProfileSearch.vue
     Purpose: search public profiles (Public Profiles feature)
     Created: 2025-07-06 – v1.0 -->
<template>
  <div>
    <input v-model="query" placeholder="Search profiles" @keyup.enter="search" />
    <button @click="search">Search</button>
    <ul>
      <li v-for="p in results" :key="p.id">{{ p.name }} ({{ p.username }})</li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const query = ref('')
const results = ref([])

async function search() {
  const url = '/api/profiles/search?search=' + encodeURIComponent(query.value)
  const res = await fetch(url)
  if (res.ok) {
    results.value = await res.json()
  }
}
</script>

<!-- End of File – Last modified 2025-07-06 -->
