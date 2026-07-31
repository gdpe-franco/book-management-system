<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import Button from "primevue/button";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const loggingOut = ref(false);
const sidebarCollapsed = ref(false);
const navigationMenu = ref<HTMLDetailsElement | null>(null);
const profileMenu = ref<HTMLDetailsElement | null>(null);
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
  closeMenus();

  await auth.logout();
  await router.push("/login");
}

function closeMenus(): void {
  for (const menu of [navigationMenu.value, profileMenu.value]) {
    menu?.removeAttribute("open");
  }
}

function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}
</script>

<template>
  <div class="app-shell">
    <aside :class="{ 'sidebar--collapsed': sidebarCollapsed }" class="sidebar">
      <div class="sidebar-brand-row">
        <Button
          class="sidebar-toggle"
          :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          :aria-expanded="!sidebarCollapsed"
          :label="sidebarCollapsed ? '›' : '‹'"
          severity="secondary"
          text
          @click="toggleSidebar"
        />
        <RouterLink class="brand" to="/">
          <span class="brand-mark">BM</span>
          <span><strong>Book</strong><small>Management</small></span>
        </RouterLink>
      </div>
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
        <details ref="navigationMenu" class="header-menu navigation-menu">
          <summary class="header-menu-button" aria-label="Open navigation">
            ☰
          </summary>
          <nav class="header-menu-panel" aria-label="Main navigation">
            <RouterLink to="/" @click="closeMenus">Dashboard</RouterLink>
            <RouterLink to="/books" @click="closeMenus">Books</RouterLink>
            <RouterLink to="/audit-logs" @click="closeMenus"
              >Audit logs</RouterLink
            >
            <RouterLink
              v-if="auth.user?.role === 'superadmin'"
              to="/users"
              @click="closeMenus"
              >Users</RouterLink
            >
          </nav>
        </details>
        <RouterLink
          class="mobile-brand"
          to="/"
          aria-label="Book Management home"
        >
          <span class="brand-mark">BM</span>
        </RouterLink>
        <div class="page-heading">
          <p class="header-kicker">Workspace</p>
          <h1>{{ pageTitle }}</h1>
        </div>
        <details ref="profileMenu" class="header-menu profile-menu">
          <summary class="profile-button" aria-label="Open profile menu">
            <span class="avatar" aria-hidden="true">{{ initials }}</span>
          </summary>
          <div class="header-menu-panel profile-menu-panel">
            <strong>{{ auth.user?.name }}</strong>
            <small>{{ auth.user?.role }}</small>
            <RouterLink to="/profile" @click="closeMenus">Profile</RouterLink>
            <Button
              label="Log out"
              :loading="loggingOut"
              severity="secondary"
              text
              @click="logout"
            />
          </div>
        </details>
      </header>
      <main class="app-main"><slot /></main>
    </div>
  </div>
</template>
