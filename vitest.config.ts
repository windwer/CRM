import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup/env.ts"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: "forks",
    // Vitest 4: forks options are top-level under test (poolOptions removed)
    forks: {
      singleFork: true,
    },
    server: {
      deps: {
        inline: ["next-auth"],
      },
    },
  },
});
