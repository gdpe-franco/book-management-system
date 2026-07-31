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

      const user = await this.fetchUser(token);

      if (user === null) {
        this.clear();

        return;
      }

      this.user = user;
    },

    async establish(token: string): Promise<boolean> {
      this.token = token;
      localStorage.setItem(tokenKey, token);

      const user = await this.fetchUser(token);

      if (user === null) {
        this.clear();

        return false;
      }

      this.user = user;

      return true;
    },

    async logout(): Promise<void> {
      try {
        if (this.token !== null) {
          await fetch("/api/v1/auth/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${this.token}` },
          });
        }
      } catch {
        // Local logout must still succeed when Laravel is unavailable.
      } finally {
        this.clear();
      }
    },

    async fetchUser(token: string): Promise<User | null> {
      try {
        const response = await fetch("/api/v1/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return null;

        return ((await response.json()) as { data: User }).data;
      } catch {
        return null;
      }
    },
  },
});
