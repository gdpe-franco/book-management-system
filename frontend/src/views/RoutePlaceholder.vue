<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";

defineProps<{ title: string; description: string }>();
</script>

<template>
  <section class="feature-placeholder">
    <Card class="placeholder-card">
      <template #title>{{ title }}</template>
      <template #content>
        <p>{{ description }}</p>
      </template>
      <template #footer>
        <Button label="Book Management System" disabled />
      </template>
    </Card>
  </section>
</template>
