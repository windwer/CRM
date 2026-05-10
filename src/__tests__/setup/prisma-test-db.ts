import { PrismaClient } from "@smartcrm/database";

if (!process.env.DATABASE_URL?.includes("smartcrm_test")) {
  throw new Error(
    "SAFETY GUARD: TEST DATABASE_URL must point to smartcrm_test. " +
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
 * No toca User ni PipelineStage de template (offerId IS NULL — son seed).
 * Sí elimina per-offer stages (offerId IS NOT NULL) creados durante tests.
 */
export async function resetTestDb() {
  await testDb.$transaction([
    testDb.communication.deleteMany(),
    testDb.applicationStatusHistory.deleteMany(),
    testDb.application.deleteMany(),
    testDb.offerChange.deleteMany(),
    testDb.pipelineStage.deleteMany({ where: { offerId: { not: null } } }),
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
