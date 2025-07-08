<!-- OnlyFans Automation Manager
     File: App.vue
     Purpose: root component
     Created: 2025‑07‑06 – v1.0 -->
<template>
  <div id="app">
    <h1>OnlyFans Automation Manager</h1>
    <PayoutPulse />
    <DmComposer />
    <MassBlast />
    <PostManager />
    <QueueView />
    <VaultBrowser />
    <LtvCard />
    <SettingsToggle />
  </div>
</template>

<script setup>
import PayoutPulse from './components/PayoutPulse.vue'
import DmComposer from './components/DmComposer.vue'
import QueueView from './components/QueueView.vue'
import VaultBrowser from './components/VaultBrowser.vue'
import MassBlast from './components/MassBlast.vue'
import PostManager from './components/PostManager.vue'
import LtvCard from './components/LtvCard.vue'
import SettingsToggle from './components/SettingsToggle.vue'
</script>

<!-- End of File – Last modified 2025‑07‑06 -->
