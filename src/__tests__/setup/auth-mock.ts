import { vi } from "vitest";

export const adminSession = {
  user: {
    id: "test-admin-id",
    email: "admin@test.local",
    name: "Test Admin",
    role: "admin" as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const recruiterSession = {
  user: {
    id: "test-recruiter-id",
    email: "recruiter@test.local",
    name: "Test Recruiter",
    role: "recruiter" as const,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Mock directo de requireRole/requireAuth para evitar la cadena auth() → DB
vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn().mockResolvedValue({ session: adminSession }),
  requireRole: vi.fn().mockResolvedValue({ session: adminSession }),
}));
