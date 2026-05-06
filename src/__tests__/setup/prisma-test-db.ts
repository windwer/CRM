import { PrismaClient } from "@antigravity/database";

if (!process.env.DATABASE_URL?.includes("antigravity_test")) {
  throw new Error(
    "SAFETY GUARD: TEST DATABASE_URL must point to antigravity_test. " +
      "Refusing to run tests against a non-test DB."
  );
}

export const testDb = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

/**
 * Limpia todas las tablas en orden FK-safe.
 * No toca User ni PipelineStage (son seed — se preservan entre tests).
 */
export async function resetTestDb() {
  await testDb.$transaction([
    testDb.communication.deleteMany(),
    testDb.applicationStatusHistory.deleteMany(),
    testDb.application.deleteMany(),
    testDb.offerChange.deleteMany(),
    testDb.offer.deleteMany(),
    testDb.gDPRDeletionQueue.deleteMany(),
    testDb.aIProcessingLog.deleteMany(),
    testDb.auditLog.deleteMany(),
    testDb.candidate.deleteMany(),
    testDb.outlookSyncState.deleteMany(),
    testDb.oAuthAccount.deleteMany(),
  ]);
}

export async function ensureSeedData() {
  const count = await testDb.pipelineStage.count();
  if (count === 0) {
    throw new Error(
      "PipelineStages no encontrados en DB de test. Ejecuta: pnpm test:setup"
    );
  }
}
