import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Carga .env.test cuando mode='test' (el default de vitest).
  // El tercer arg "" hace que se carguen TODOS los vars, no solo los con prefijo VITE_.
  // Pasarlo a test.env garantiza que los valores de .env.test prevalecen sobre .env.local.
  const env = loadEnv(mode ?? "test", process.cwd(), "");

  return {
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
      fileParallelism: false,
      server: {
        deps: {
          inline: ["next-auth"],
        },
      },
      env,
    },
  };
});
