import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Map()),
  cookies: vi.fn(() => new Map()),
}));

// Mock NextAuth
// Note: Use the absolute alias to ensure all imports are caught
vi.mock("@/../auth", () => ({
  auth: vi.fn(() => Promise.resolve({ 
    user: { 
      id: "test-user-id", 
      role: "admin",
      name: "Test Admin",
      email: "admin@antigravity.local"
    } 
  })),
}));

// Mock Prisma
vi.mock("@/lib/db", () => ({
  db: {
    offer: {
      findMany: vi.fn(() => Promise.resolve([])),
      findUnique: vi.fn(() => Promise.resolve({ id: "1", status: "published" })),
      count: vi.fn(() => Promise.resolve(0)),
      create: vi.fn((args) => Promise.resolve({ id: "1", ...args.data })),
      update: vi.fn((args) => Promise.resolve({ id: "1", ...args.data })),
      groupBy: vi.fn(() => Promise.resolve([])),
    },
    candidate: {
      findMany: vi.fn(() => Promise.resolve([])),
      findUnique: vi.fn(() => Promise.resolve({ id: "1" })),
      count: vi.fn(() => Promise.resolve(0)),
      create: vi.fn((args) => Promise.resolve({ id: "1", ...args.data })),
      update: vi.fn((args) => Promise.resolve({ id: "1", ...args.data })),
    },
    application: {
      findMany: vi.fn(() => Promise.resolve([])),
      findUnique: vi.fn(() => Promise.resolve({ id: "1" })),
      count: vi.fn(() => Promise.resolve(0)),
      create: vi.fn((args) => Promise.resolve({ id: "1", ...args.data })),
      update: vi.fn((args) => Promise.resolve({ id: "1", ...args.data })),
      groupBy: vi.fn(() => Promise.resolve([])),
    },
    gDPRDeletionQueue: {
      findMany: vi.fn(() => Promise.resolve([])),
      create: vi.fn((args) => Promise.resolve({ id: "1", ...args.data })),
      updateMany: vi.fn(() => Promise.resolve({ count: 1 })),
    },
    $transaction: vi.fn((cb) => cb(db)), // Simple transaction mock
  },
}));

const db = {
  offer: {
    findUnique: vi.fn(() => Promise.resolve({ id: "1", status: "published" })),
    update: vi.fn((args) => Promise.resolve({ id: "1", ...args.data })),
    create: vi.fn((args) => Promise.resolve({ id: "1", ...args.data })),
  },
  offerChange: {
    create: vi.fn(() => Promise.resolve({ id: "1" })),
  },
  application: {
    findUnique: vi.fn(() => Promise.resolve({ id: "1", status: "applied" })),
    update: vi.fn((args) => Promise.resolve({ id: "1", ...args.data })),
  },
  applicationStatusHistory: {
    create: vi.fn(() => Promise.resolve({ id: "1" })),
  },
  candidate: {
    update: vi.fn((args) => Promise.resolve({ id: "1", ...args.data })),
  },
  gDPRDeletionQueue: {
    updateMany: vi.fn(() => Promise.resolve({ count: 1 })),
  }
};

// Mock Logger
vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
