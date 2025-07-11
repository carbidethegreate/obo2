<!-- OnlyFans Automation Manager
     File: PostManager.vue
     Purpose: create and list posts (Post management)
     Created: 2025‑07‑06 – v1.0 -->
<template>
  <div class="post-manager">
    <h2>Post Manager</h2>
    <form @submit.prevent="create">
      <textarea v-model="text" placeholder="Caption"></textarea>
      <input v-model="mediaId" placeholder="Media ID" />
      <input v-model="scheduled" placeholder="ISO schedule" />
      <button type="submit">Submit</button>
    </form>
    <ul>
      <li v-for="post in posts" :key="post.id">
        {{ post.text }} - {{ post.postedAt }}
        <button @click="remove(post.id)">Delete</button>
      </li>
    </ul>
    <div v-if="status">{{ status }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const posts = ref([])
const text = ref('')
const mediaId = ref('')
const scheduled = ref('')
const status = ref('')

async function load() {
  const res = await fetch('/api/posts')
  if (res.ok) {
    const data = await res.json()
    posts.value = data.data || []
  }
}

async function create() {
  status.value = 'Sending...'
  const body = {
    text: text.value,
    mediaFiles: mediaId.value ? [mediaId.value] : [],
    scheduledDate: scheduled.value || null
  }
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  status.value = res.ok ? 'Created' : 'Error'
  load()
}

async function remove(id) {
  await fetch(`/api/posts/${id}`, { method: 'DELETE' })
  posts.value = posts.value.filter(p => p.id !== id)
}

onMounted(load)
</script>

<!-- End of File – Last modified 2025‑07‑06 -->
