import { defineStore } from "pinia";

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "superadmin";
};

type AuthState = {
  token: string | null;
  user: User | null;
};

const tokenKey = "book-management.token";
let restoration: Promise<void> | undefined;

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({ token: null, user: null }),

  getters: {
    isAuthenticated: (state) => state.token !== null && state.user !== null,
  },

  actions: {
    clear() {
      this.token = null;
      this.user = null;
      localStorage.removeItem(tokenKey);
    },

    restore(): Promise<void> {
      restoration ??= this.restoreSession();

      return restoration;
    },

    async restoreSession(): Promise<void> {
      const token = localStorage.getItem(tokenKey);

      if (token === null) return;

      this.token = token;

      try {
        const response = await fetch("/api/v1/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          this.clear();

          return;
        }

        this.user = ((await response.json()) as { data: User }).data;
      } catch {
        this.clear();
      }
    },
  },
});
