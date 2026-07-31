<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import Button from "primevue/button";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const loggingOut = ref(false);
const initials = computed(
  () => auth.user?.name.slice(0, 1).toUpperCase() ?? "?",
);
const pageTitle = computed(
  () =>
    ({
      "/": "Dashboard",
      "/profile": "Profile",
      "/books": "Books",
      "/audit-logs": "Audit logs",
      "/users": "Users",
    })[route.path] ?? "Dashboard",
);

async function logout(): Promise<void> {
  loggingOut.value = true;

  await auth.logout();
  await router.push("/login");
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <RouterLink class="brand" to="/">
        <span class="brand-mark">BM</span>
        <span><strong>Book</strong><small>Management</small></span>
      </RouterLink>
      <p class="nav-caption">Workspace</p>
      <nav aria-label="Main navigation">
        <RouterLink to="/">Dashboard</RouterLink>
        <RouterLink to="/books">Books</RouterLink>
        <RouterLink to="/audit-logs">Audit logs</RouterLink>
        <RouterLink v-if="auth.user?.role === 'superadmin'" to="/users"
          >Users</RouterLink
        >
      </nav>
    </aside>

    <div class="app-content">
      <header class="app-header">
        <div>
          <p class="header-kicker">Workspace</p>
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="header-actions">
          <RouterLink class="user-summary" to="/profile">
            <span class="avatar" aria-hidden="true">{{ initials }}</span>
            <span
              ><strong>{{ auth.user?.name }}</strong
              ><small>{{ auth.user?.role }}</small></span
            >
          </RouterLink>
          <Button
            label="Log out"
            :loading="loggingOut"
            severity="secondary"
            text
            @click="logout"
          />
        </div>
      </header>
      <main class="app-main"><slot /></main>
    </div>
  </div>
</template>
