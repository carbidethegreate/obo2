<!-- OnlyFans Automation Manager
     File: VaultBrowser.vue
     Purpose: browse vault lists
     Created: 2025-07-06 – v1.0 -->
<template>
  <div class="vault-browser">
    <h2>Vault</h2>
    <form @submit.prevent="createList">
      <input v-model="newName" placeholder="New list name" />
      <button type="submit">Add</button>
    </form>
    <ul>
      <li v-for="list in lists" :key="list.id">
        <input v-model="list.name" />
        <button @click="rename(list)">Save</button>
        <button @click="remove(list.id)">Delete</button>
      </li>
    </ul>
    <div v-if="loading">Loading...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const lists = ref([])
const newName = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  const res = await fetch('/api/vault/lists')
  if (res.ok) {
    const data = await res.json()
    lists.value = data.data || []
  }
  loading.value = false
}

async function createList() {
  if (!newName.value) return
  await fetch('/api/vault/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName.value })
  })
  newName.value = ''
  load()
}

async function rename(list) {
  await fetch(`/api/vault/lists/${list.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: list.name })
  })
}

async function remove(id) {
  await fetch(`/api/vault/lists/${id}`, { method: 'DELETE' })
  lists.value = lists.value.filter(l => l.id !== id)
}

onMounted(load)
</script>

<!-- End of File – Last modified 2025-07-06 -->
