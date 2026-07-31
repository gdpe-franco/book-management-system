import process from "node:process";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const apiProxyTarget = process.env.BACKEND_API_HOST;
const auditApiHost = process.env.AUDIT_API_HOST;

if (apiProxyTarget === undefined) {
  throw new Error("BACKEND_API_HOST is required.");
}

if (auditApiHost === undefined) {
  throw new Error("AUDIT_API_HOST is required.");
}

export default defineConfig({
  plugins: [vue()],
  define: {
    "import.meta.env.VITE_AUDIT_API_HOST": JSON.stringify(auditApiHost),
  },
  server: {
    proxy: {
      "/api": apiProxyTarget,
    },
  },
});
