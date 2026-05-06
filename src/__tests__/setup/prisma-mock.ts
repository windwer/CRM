import { mockReset, DeepMockProxy } from "vitest-mock-extended";
import { beforeEach } from "vitest";
import { prismaMock as _prismaMock } from "./prisma-instance";
import type { PrismaClient } from "@antigravity/database";

// Re-exportamos el singleton — todos los tests reciben la misma instancia
// que @/lib/db devuelve (gracias al vi.mock en env.ts).
export const prismaMock = _prismaMock;

// Reset antes de cada test para que los mocks sean independientes
beforeEach(() => {
  mockReset(prismaMock);
});

/**
 * Configura $transaction para soportar AMBOS patrones del proyecto:
 *
 *   Callback: prisma.$transaction(async (tx) => { ... })
 *             → tx es prismaMock (mismo mock, mismas promesas configuradas)
 *
 *   Array:    prisma.$transaction([op1, op2])
 *             → resuelve con [await op1, await op2]
 *
 * Llamar en el beforeEach de cada test suite que use transacciones.
 */
export function setupTransactionMock() {
  prismaMock.$transaction.mockImplementation(async (input: any) => {
    if (typeof input === "function") {
      return await input(prismaMock);
    }
    if (Array.isArray(input)) {
      return await Promise.all(input);
    }
    throw new Error("setupTransactionMock: invalid $transaction input");
  });
}

export type PrismaMock = DeepMockProxy<PrismaClient>;
