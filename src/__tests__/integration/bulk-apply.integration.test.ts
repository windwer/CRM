import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";

// Override db ANTES de que el route handler importe @/lib/db.
// Si no se hace aquí (en el propio test file), la hoist de vi.mock no afectaría
// al módulo ya cacheado por env.ts.
vi.mock("@/lib/db", async () => {
  const { testDb } = await import("@/__tests__/setup/prisma-test-db");
  return { db: testDb };
});

import { NextRequest } from "next/server";
import { testDb, resetTestDb, ensureSeedData } from "@/__tests__/setup/prisma-test-db";
import {
  createTestUser,
  createTestOffer,
  createTestCandidate,
  createTestCandidates,
  createTestApplication,
  getStage,
} from "@/__tests__/setup/factories";
import { POST as bulkApplyHandler } from "@/app/api/candidates/bulk-apply/route";

async function callBulkApply(body: Record<string, unknown>) {
  const req = new NextRequest("http://localhost/api/candidates/bulk-apply", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  const res = await bulkApplyHandler(req);
  return { status: res.status, body: await res.json() };
}

describe("bulkApply integration", () => {
  beforeAll(async () => {
    await ensureSeedData();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  // === CASO FELIZ ===

  it("crea N applications para una oferta", async () => {
    const offer = await createTestOffer();
    const candidates = await createTestCandidates(5);

    const { status, body } = await callBulkApply({
      candidateIds: candidates.map((c) => c.id),
      offerId: offer.id,
    });

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.created).toBe(5);
    expect(body.data.skipped).toBe(0);

    const apps = await testDb.application.findMany({ where: { offerId: offer.id } });
    expect(apps).toHaveLength(5);
  });

  // === IDEMPOTENCIA / SKIP DUPLICADOS ===

  it("omite candidatos ya vinculados sin error", async () => {
    const offer = await createTestOffer();
    const candidates = await createTestCandidates(3);

    // Pre-vincular 1 candidato manualmente
    await createTestApplication({ candidateId: candidates[0].id, offerId: offer.id });

    const { status, body } = await callBulkApply({
      candidateIds: candidates.map((c) => c.id),
      offerId: offer.id,
    });

    expect(status).toBe(200);
    expect(body.data.created).toBe(2);
    expect(body.data.skipped).toBe(1);
    expect(body.data.skippedNames).toHaveLength(1);

    const apps = await testDb.application.findMany({ where: { offerId: offer.id } });
    expect(apps).toHaveLength(3); // 1 pre-existente + 2 nuevas
  });

  // === BLOQUEO closed_hired ===

  it("rechaza bulk apply en oferta closed_hired", async () => {
    const offer = await createTestOffer({ status: "closed_hired" });
    const candidates = await createTestCandidates(2);

    const { status, body } = await callBulkApply({
      candidateIds: candidates.map((c) => c.id),
      offerId: offer.id,
    });

    expect(status).toBe(400);
    expect(body.success).toBe(false);

    const apps = await testDb.application.findMany({ where: { offerId: offer.id } });
    expect(apps).toHaveLength(0);
  });

  // === LIMITE 50 ===

  it("rechaza si candidateIds > 50", async () => {
    const offer = await createTestOffer();
    const candidates = await createTestCandidates(51);

    const { status } = await callBulkApply({
      candidateIds: candidates.map((c) => c.id),
      offerId: offer.id,
    });

    expect(status).toBe(400);
  });

  // === STAGE PERSONALIZADO ===

  it("respeta pipelineStageId si se pasa", async () => {
    const offer = await createTestOffer();
    const candidates = await createTestCandidates(2);
    const interviewStage = await getStage("interview_internal");

    const { status, body } = await callBulkApply({
      candidateIds: candidates.map((c) => c.id),
      offerId: offer.id,
      pipelineStageId: interviewStage.id,
    });

    expect(status).toBe(200);
    expect(body.data.created).toBe(2);

    const apps = await testDb.application.findMany({ where: { offerId: offer.id } });
    expect(apps.every((a) => a.pipelineStageId === interviewStage.id)).toBe(true);
  });

  // === ERROR: oferta no existe ===

  it("devuelve 404 si oferta no existe", async () => {
    const candidates = await createTestCandidates(2);

    const { status } = await callBulkApply({
      candidateIds: candidates.map((c) => c.id),
      offerId: "00000000-0000-0000-0000-000000000000",
    });

    expect(status).toBe(404);
  });

  // === CONCURRENCIA LOGICA ===
  // Con skipDuplicates:true en createMany, dos llamadas paralelas sobre la misma
  // oferta no generan duplicados ni errores de constraint.

  it("bulk apply concurrente sobre la misma oferta no genera duplicados", async () => {
    const offer = await createTestOffer();
    const candidates = await createTestCandidates(5);
    const ids = candidates.map((c) => c.id);

    const [r1, r2] = await Promise.all([
      callBulkApply({ candidateIds: ids, offerId: offer.id }),
      callBulkApply({ candidateIds: ids, offerId: offer.id }),
    ]);

    // Ambas llamadas deben terminar exitosamente
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);

    // La DB tiene exactamente 5 applications (unique constraint + skipDuplicates)
    const apps = await testDb.application.findMany({ where: { offerId: offer.id } });
    expect(apps).toHaveLength(5);

    // Entre las dos llamadas se insertaron exactamente 5 en total
    expect(r1.body.data.created + r2.body.data.created).toBe(5);
  });
});
