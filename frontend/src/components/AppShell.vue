<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import Button from "primevue/button";
import { useAuthStore } from "../stores/auth";
import { useNotificationStore } from "../stores/notifications";
import { useThemeStore } from "../stores/theme";

const auth = useAuthStore();
const notifications = useNotificationStore();
const theme = useThemeStore();
const route = useRoute();
const router = useRouter();
const loggingOut = ref(false);
const sidebarCollapsed = ref(false);
const navigationMenu = ref<HTMLDetailsElement | null>(null);
const profileMenu = ref<HTMLDetailsElement | null>(null);
const notificationMenu = ref<HTMLDetailsElement | null>(null);
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
  for (const menu of [
    navigationMenu.value,
    notificationMenu.value,
    profileMenu.value,
  ]) {
    menu?.removeAttribute("open");
  }
}

function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

function clearNotifications(): void {
  notifications.clear();
  closeMenus();
}

function openAuditLog(eventId: string): void {
  notifications.markRead(eventId);
  closeMenus();
  void router.push({ path: "/audit-logs", query: { highlight: eventId } });
}

function notificationTitle(notification: {
  book_snapshot: { title?: unknown };
}): string {
  return typeof notification.book_snapshot.title === "string"
    ? notification.book_snapshot.title
    : "Unknown book";
}

onMounted(() => {
  if (auth.user !== null && auth.token !== null) {
    notifications.connect(auth.user.id, auth.token);
  }
});

onUnmounted(() => notifications.disconnect());
</script>

<template>
  <div :class="{ 'app-shell--dark': theme.dark }" class="app-shell">
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
        <div class="header-actions">
          <Button
            :aria-label="theme.dark ? 'Use light mode' : 'Use dark mode'"
            :icon="theme.dark ? 'pi pi-sun' : 'pi pi-moon'"
            severity="secondary"
            text
            @click="theme.toggle"
          />
          <details ref="notificationMenu" class="header-menu notification-menu">
            <summary
              class="notification-button"
              :aria-label="`Open notifications (${notifications.unreadCount} unread)`"
            >
              <i class="pi pi-bell" aria-hidden="true" />
              <span
                v-if="notifications.unreadCount > 0"
                class="notification-count"
                >{{ notifications.unreadCount }}</span
              >
            </summary>
            <div class="header-menu-panel notification-menu-panel">
              <div class="notification-menu-heading">
                <strong>Notifications</strong>
                <Button
                  v-if="notifications.unreadCount > 0"
                  label="Clear all"
                  severity="secondary"
                  text
                  @click="clearNotifications"
                />
              </div>
              <p
                v-if="notifications.unreadCount === 0"
                class="notification-empty"
              >
                No new audit logs.
              </p>
              <ul v-else class="notification-list">
                <li
                  v-for="notification in notifications.notifications"
                  :key="notification.event_id"
                >
                  <button @click="openAuditLog(notification.event_id)">
                    <strong>{{ notification.event_type }}</strong>
                    <span>{{ notificationTitle(notification) }}</span>
                  </button>
                </li>
              </ul>
            </div>
          </details>
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
        </div>
      </header>
      <main class="app-main"><slot /></main>
    </div>
  </div>
</template>
