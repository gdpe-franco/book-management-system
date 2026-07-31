<script setup>
import Button from 'primevue/button'
import Card from 'primevue/card'

defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
})
</script>

<template>
  <main class="placeholder-page">
    <Card class="placeholder-card">
      <template #title>{{ title }}</template>
      <template #content>
        <p>{{ description }}</p>
      </template>
      <template #footer>
        <Button label="Book Management System" disabled />
      </template>
    </Card>
  </main>
</template>
