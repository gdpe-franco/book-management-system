<script setup lang="ts">
import Card from "primevue/card";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
</script>

<template>
  <Card class="content-card">
    <template #title
      ><p class="card-kicker">Account</p>
      Profile</template
    >
    <template #content>
      <dl class="profile-details">
        <div>
          <dt>Name</dt>
          <dd>{{ auth.user?.name }}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{{ auth.user?.email }}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{{ auth.user?.role }}</dd>
        </div>
      </dl>
    </template>
  </Card>
</template>
