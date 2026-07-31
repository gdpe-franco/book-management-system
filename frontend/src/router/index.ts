import { createRouter, createWebHistory } from "vue-router";
import type { RouteMeta, RouteRecordRaw } from "vue-router";
import { useAuthStore } from "../stores/auth";
import AuthView from "../views/AuthView.vue";
import RoutePlaceholder from "../views/RoutePlaceholder.vue";

declare module "vue-router" {
  interface RouteMeta {
    guestOnly?: boolean;
    requiresAuth?: boolean;
  }
}

const route = (
  path: string,
  title: string,
  description: string,
  meta: RouteMeta = {},
): RouteRecordRaw => ({
  path,
  component: RoutePlaceholder,
  props: { title, description },
  meta,
});

const router = createRouter({
  history: createWebHistory(),
  routes: [
    route(
      "/",
      "Dashboard",
      "Your authenticated dashboard will be available here.",
      { requiresAuth: true },
    ),
    route("/profile", "Profile", "Your profile will be available here.", {
      requiresAuth: true,
    }),
    route(
      "/books",
      "Books",
      "Book management will be available in the next dashboard feature.",
      { requiresAuth: true },
    ),
    route(
      "/audit-logs",
      "Audit logs",
      "Audit history will be available in a later dashboard feature.",
      { requiresAuth: true },
    ),
    route("/users", "Users", "User management is deferred until handoff.", {
      requiresAuth: true,
    }),
    {
      path: "/login",
      component: AuthView,
      props: { mode: "login" },
      meta: { guestOnly: true },
    },
    {
      path: "/register",
      component: AuthView,
      props: { mode: "register" },
      meta: { guestOnly: true },
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  await auth.restore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) return "/login";
  if (to.meta.guestOnly && auth.isAuthenticated) return "/";
});

export default router;
