import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const src = (p) => fileURLToPath(new URL(`./src/${p}`, import.meta.url));

// Top-level folders under src/ that are imported as absolute paths, e.g. "lib/api.js".
const ABSOLUTE_ROOTS = ["components", "constants", "data", "hooks", "lib", "pages", "styles"];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.VITE_BACKEND_URL || "http://127.0.0.1:8002";
  const proxy = {
    "/api": { target: backend, changeOrigin: true, cookieDomainRewrite: "" },
    "/media": { target: backend, changeOrigin: true },
  };

  return {
    plugins: [react()],
    resolve: {
      alias: [{ find: new RegExp(`^(${ABSOLUTE_ROOTS.join("|")})/`), replacement: `${src("")}$1/` }],
    },
    server: { port: 3002, host: true, proxy },
    preview: { port: 3002, host: true, proxy },
    build: { outDir: "build", sourcemap: false, chunkSizeWarningLimit: 900 },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.js"],
      css: false,
      include: ["src/**/*.test.{js,jsx}"],
    },
  };
});
