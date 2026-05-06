import { vi } from "vitest";

// Mock global de Next.js server APIs
vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Map()),
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock de NextAuth — devuelve siempre sesion de admin en tests.
// Usado por auth-helpers.ts -> requireAuth -> requireRole en los route handlers.
vi.mock("@/../auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "test-admin-id",
      email: "admin@test.local",
      name: "Test Admin",
      role: "admin",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }),
}));

// Mock de Prisma — debe estar aquí (setupFile) para que se aplique ANTES de que
// los route handlers importen @/lib/db. vi.mock en módulos importados no se iza.
vi.mock("@/lib/db", async () => {
  const { prismaMock } = await import("@/__tests__/setup/prisma-instance");
  return { db: prismaMock };
});

// Silenciar logs en tests — solo errores reales deben verse
vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
