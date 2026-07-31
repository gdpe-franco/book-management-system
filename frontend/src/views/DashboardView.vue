<script setup lang="ts">
import Card from "primevue/card";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
</script>

<template>
  <Card class="content-card">
    <template #title
      ><p class="card-kicker">Your workspace</p>
      Welcome back, {{ auth.user?.name }}</template
    >
    <template #content>
      <p>
        You are signed in as <strong>{{ auth.user?.role }}</strong
        >. Choose an area from the menu to continue.
      </p>
    </template>
  </Card>
</template>
