<!-- OnlyFans Automation Manager
     File: DmComposer.vue
     Purpose: quick DM composer (User Story B-1)
     Created: 2025‑07‑06 – v1.0 -->
<template>
  <form @submit.prevent="send">
    <input v-model="fanId" placeholder="Fan ID" />
    <input v-model="text" placeholder="Message" />
    <input v-model="mediaId" placeholder="Media ID" />
    <button type="submit">Send</button>
    <div v-if="status">{{ status }}</div>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const fanId = ref('')
const text = ref('')
const mediaId = ref('')
const status = ref('')

async function send() {
  status.value = 'Sending...'
  try {
    await fetch(`/api/fans/${fanId.value}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.value, mediaId: mediaId.value })
    })
    status.value = 'Sent!'
  } catch (err) {
    status.value = 'Error'
  }
}
</script>

<!-- End of File – Last modified 2025‑07‑06 -->
