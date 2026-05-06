import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";

// Estos vi.mock se izan ANTES de que gdpr.ts (y sus importaciones) sean resueltos.
// Si estuvieran en un helper importado (como external-mocks.ts) NO se izarían y gdpr.ts
// usaría los módulos reales.

vi.mock("@/lib/db", async () => {
  const { testDb } = await import("@/__tests__/setup/prisma-test-db");
  return { db: testDb };
});

vi.mock("@/lib/azure/blobService", () => ({
  deleteBlob: vi.fn().mockResolvedValue(undefined),
  uploadBlob: vi.fn().mockResolvedValue("mock-blob-id"),
  getBlob: vi.fn().mockResolvedValue(Buffer.from("mock-content")),
}));

import { deleteBlob } from "@/lib/azure/blobService";
import { testDb, resetTestDb, ensureSeedData } from "@/__tests__/setup/prisma-test-db";
import {
  createTestUser,
  createTestCandidate,
  createGDPRQueueEntry,
} from "@/__tests__/setup/factories";
import { runGDPRCleanup, anonymizeCandidate } from "@/lib/gdpr";

describe("runGDPRCleanup integration", () => {
  beforeAll(async () => {
    await ensureSeedData();
    // hasAzureStorageConfig() en gdpr.ts lee estas vars en runtime.
    process.env.AZURE_STORAGE_ACCOUNT_NAME = "test-account";
    process.env.AZURE_STORAGE_ACCOUNT_KEY = "test-key-base64==";
  });

  beforeEach(async () => {
    await resetTestDb();
    vi.mocked(deleteBlob).mockClear();
    vi.mocked(deleteBlob).mockResolvedValue(undefined);
  });

  // === CASO FELIZ ===

  it("anonimiza candidatos vencidos en batch", async () => {
    const c1 = await createTestCandidate({ cvBlobId: "blob-1" });
    const c2 = await createTestCandidate({ cvBlobId: "blob-2" });
    await createGDPRQueueEntry(c1.id, true);
    await createGDPRQueueEntry(c2.id, true);

    const result = await runGDPRCleanup();

    expect(result.processed).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.errors).toEqual([]);

    // Candidatos anonimizados correctamente
    for (const c of [c1, c2]) {
      const after = await testDb.candidate.findUnique({ where: { id: c.id } });
      expect(after?.fullName).toBe("ANONYMIZED");
      expect(after?.email).toMatch(/^anonymized-.*@anonymized\.local$/);
      expect(after?.cvBlobId).toBeNull();
      expect(after?.anonymizedAt).toBeInstanceOf(Date);
    }

    // Blob borrado para cada candidato con cvBlobId
    expect(vi.mocked(deleteBlob)).toHaveBeenCalledTimes(2);

    // Queue marcada como anonymized
    const queueAfter = await testDb.gDPRDeletionQueue.findMany({
      where: { candidateId: { in: [c1.id, c2.id] } },
    });
    expect(queueAfter.every((q) => q.status === "anonymized")).toBe(true);

    // AuditLog con source='cron' y userId=null
    const audits = await testDb.auditLog.findMany({
      where: { entityType: "candidate", action: "gdpr_anonymize" },
    });
    expect(audits.length).toBe(2);
    expect(audits.every((a) => a.source === "cron")).toBe(true);
    expect(audits.every((a) => a.userId === null)).toBe(true);
  });

  // === IDEMPOTENCIA ===

  it("es idempotente: re-ejecutar no anonimiza dos veces", async () => {
    const candidate = await createTestCandidate();
    await createGDPRQueueEntry(candidate.id, true);

    const r1 = await runGDPRCleanup();
    expect(r1.processed).toBe(1);

    // Segunda ejecucion: queue ya es 'anonymized', no aparece en batch
    const r2 = await runGDPRCleanup();
    expect(r2.processed).toBe(0);

    // Un solo registro de audit
    const audits = await testDb.auditLog.findMany({
      where: { entityId: candidate.id },
    });
    expect(audits.length).toBe(1);
  });

  // === ANONIMIZACION DE COMUNICACIONES ===

  it("nullifica subject y body de communications vinculadas al candidato", async () => {
    const user = await createTestUser({ role: "recruiter" });
    const candidate = await createTestCandidate();
    await createGDPRQueueEntry(candidate.id, true);

    const offer = await testDb.offer.create({
      data: {
        title: "Test GDPR Offer",
        description: "Test description min 10",
        department: "Eng",
        location: "Remote",
        status: "published",
        createdBy: user.id,
      },
    });
    const pendingStage = await testDb.pipelineStage.findUnique({
      where: { slug: "pending" },
    });
    const app = await testDb.application.create({
      data: {
        candidateId: candidate.id,
        offerId: offer.id,
        pipelineStageId: pendingStage!.id,
      },
    });
    await testDb.communication.create({
      data: {
        applicationId: app.id,
        type: "email",
        subject: "PII subject",
        body: "PII body with sensitive info",
        isOutbound: true,
        sentBy: user.id,
      },
    });

    await runGDPRCleanup();

    const commsAfter = await testDb.communication.findMany({
      where: { applicationId: app.id },
    });
    expect(commsAfter[0].subject).toBeNull();
    expect(commsAfter[0].body).toBeNull();
    // Metadatos no PII preservados
    expect(commsAfter[0].type).toBe("email");
    expect(commsAfter[0].isOutbound).toBe(true);
  });

  // === ERRORES / RESILIENCIA ===

  it("continua con resto del batch si un blob delete falla", async () => {
    // El primer candidato: blob delete falla
    vi.mocked(deleteBlob)
      .mockRejectedValueOnce(new Error("Blob 404"))
      .mockResolvedValueOnce(undefined);

    const c1 = await createTestCandidate({ cvBlobId: "blob-fail" });
    const c2 = await createTestCandidate({ cvBlobId: "blob-ok" });
    await createGDPRQueueEntry(c1.id, true);
    await createGDPRQueueEntry(c2.id, true);

    const result = await runGDPRCleanup();

    // El fallo de blob es capturado internamente (warn) — ambos se procesan
    expect(result.processed).toBe(2);
    expect(result.errors).toEqual([]);

    const after1 = await testDb.candidate.findUnique({ where: { id: c1.id } });
    const after2 = await testDb.candidate.findUnique({ where: { id: c2.id } });
    expect(after1?.fullName).toBe("ANONYMIZED");
    expect(after2?.fullName).toBe("ANONYMIZED");
  });

  // === CASO LIMITE: candidato sin blob ===

  it("procesa candidato sin cvBlobId sin llamar deleteBlob", async () => {
    const candidate = await createTestCandidate({ cvBlobId: null });
    await createGDPRQueueEntry(candidate.id, true);

    const result = await runGDPRCleanup();

    expect(result.processed).toBe(1);
    expect(vi.mocked(deleteBlob)).not.toHaveBeenCalled();
  });

  // === CASO LIMITE: deletionDate futura ===

  it("NO procesa entradas con deletionDate en el futuro", async () => {
    const candidate = await createTestCandidate();
    await createGDPRQueueEntry(candidate.id, false); // futura

    const result = await runGDPRCleanup();

    expect(result.processed).toBe(0);
    const after = await testDb.candidate.findUnique({ where: { id: candidate.id } });
    expect(after?.fullName).not.toBe("ANONYMIZED");
  });

  // === ANONIMIZACION MANUAL con userId ===

  it("anonymizeCandidate manual registra source=manual con userId correcto", async () => {
    const adminUser = await createTestUser({ role: "admin" });
    const candidate = await createTestCandidate();
    await createGDPRQueueEntry(candidate.id, true);

    await anonymizeCandidate(candidate.id, {
      userId: adminUser.id,
      source: "manual",
    });

    const audit = await testDb.auditLog.findFirst({
      where: { entityId: candidate.id, action: "gdpr_anonymize" },
    });
    expect(audit?.source).toBe("manual");
    expect(audit?.userId).toBe(adminUser.id);
  });
});
