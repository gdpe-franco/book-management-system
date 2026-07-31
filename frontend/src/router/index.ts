import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import AuthView from "../views/AuthView.vue";
import DashboardView from "../views/DashboardView.vue";
import ProfileView from "../views/ProfileView.vue";
import AuditLogsView from "../views/AuditLogsView.vue";

declare module "vue-router" {
  interface RouteMeta {
    guestOnly?: boolean;
    requiresAuth?: boolean;
    requiresSuperadmin?: boolean;
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: DashboardView, meta: { requiresAuth: true } },
    { path: "/profile", component: ProfileView, meta: { requiresAuth: true } },
    {
      path: "/books",
      component: () => import("../views/books/View.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/audit-logs",
      component: AuditLogsView,
      meta: { requiresAuth: true },
    },
    {
      path: "/users",
      component: () => import("../views/users/View.vue"),
      meta: { requiresAuth: true, requiresSuperadmin: true },
    },
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
  if (to.meta.requiresSuperadmin && auth.user?.role !== "superadmin")
    return "/";
  if (to.meta.guestOnly && auth.isAuthenticated) return "/";
});

export default router;
