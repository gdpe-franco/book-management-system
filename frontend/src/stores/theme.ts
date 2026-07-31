import { defineStore } from "pinia";

const themeKey = "book-management.theme";

export const useThemeStore = defineStore("theme", {
  state: () => ({ dark: false }),

  actions: {
    initialize(): void {
      this.dark = localStorage.getItem(themeKey) === "dark";
      this.apply();
    },

    toggle(): void {
      this.dark = !this.dark;
      localStorage.setItem(themeKey, this.dark ? "dark" : "light");
      this.apply();
    },

    apply(): void {
      document.documentElement.classList.toggle("app-dark", this.dark);
    },
  },
});
