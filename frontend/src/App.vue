<script setup lang="ts">
import { useRoute, RouterView } from "vue-router";
import AppShell from "./components/AppShell.vue";
import Toast from "primevue/toast";

const route = useRoute();
</script>

<template>
  <Toast />
  <RouterView v-slot="{ Component }">
    <AppShell v-if="route.meta.requiresAuth">
      <component :is="Component" />
    </AppShell>
    <component :is="Component" v-else />
  </RouterView>
</template>
