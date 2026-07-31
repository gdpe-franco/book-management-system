import process from "node:process";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const apiProxyTarget = process.env.FRONTEND_API_PROXY_TARGET;

if (apiProxyTarget === undefined) {
  throw new Error("FRONTEND_API_PROXY_TARGET is required.");
}

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": apiProxyTarget,
    },
  },
});
