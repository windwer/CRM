import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";

// changeApplicationStage usa db.$transaction internamente — necesita override
// para usar testDb en lugar del prismaMock registrado en env.ts.
vi.mock("@/lib/db", async () => {
  const { testDb } = await import("@/__tests__/setup/prisma-test-db");
  return { db: testDb };
});

import { testDb, resetTestDb, ensureSeedData } from "@/__tests__/setup/prisma-test-db";
import {
  createTestUser,
  createTestApplication,
  getStage,
} from "@/__tests__/setup/factories";
import { changeApplicationStage } from "@/lib/application-stage";

describe("changeApplicationStage integration", () => {
  beforeAll(async () => {
    await ensureSeedData();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  // === CASO FELIZ ===

  it("cambia el stage y crea entrada en historial", async () => {
    const recruiter = await createTestUser({ role: "recruiter" });
    const app = await createTestApplication();
    const interviewStage = await getStage("interview_internal");

    const result = await changeApplicationStage({
      applicationId: app.id,
      newStageId: interviewStage.id,
      changedById: recruiter.id,
    });

    expect(result.changed).toBe(true);

    const after = await testDb.application.findUnique({
      where: { id: app.id },
      include: { pipelineStage: true },
    });
    expect(after?.pipelineStage.slug).toBe("interview_internal");
    expect(after?.lastContactAt).toBeInstanceOf(Date);
    expect(after?.lastContactedBy).toBe(recruiter.id);

    const history = await testDb.applicationStatusHistory.findMany({
      where: { applicationId: app.id },
      include: { previousStage: true, newStage: true },
    });
    expect(history).toHaveLength(1);
    expect(history[0].previousStage?.slug).toBe("pending");
    expect(history[0].newStage.slug).toBe("interview_internal");
    expect(history[0].changedById).toBe(recruiter.id);
  });

  // === IDEMPOTENCIA / NO-OP ===

  it("no-op si la application ya esta en el stage destino", async () => {
    const app = await createTestApplication();
    const pendingStage = await getStage("pending");

    const result = await changeApplicationStage({
      applicationId: app.id,
      newStageId: pendingStage.id,
      changedById: null,
    });

    expect(result.changed).toBe(false);

    // No se crea entrada en historial en un no-op
    const history = await testDb.applicationStatusHistory.findMany({
      where: { applicationId: app.id },
    });
    expect(history).toHaveLength(0);
  });

  // === ERRORES ===

  it("falla si applicationId no existe", async () => {
    const hiredStage = await getStage("hired");

    await expect(
      changeApplicationStage({
        applicationId: "00000000-0000-0000-0000-000000000000",
        newStageId: hiredStage.id,
        changedById: null,
      })
    ).rejects.toThrow();
  });

  it("falla si newStageId no existe o esta inactivo", async () => {
    const app = await createTestApplication();

    await expect(
      changeApplicationStage({
        applicationId: app.id,
        newStageId: "00000000-0000-0000-0000-000000000000",
        changedById: null,
      })
    ).rejects.toThrow();
  });

  // === CASO LIMITE: cadena de cambios ===

  it("crea N entradas coherentes en historial al hacer N cambios consecutivos", async () => {
    const app = await createTestApplication();
    const stageSlugs = [
      "awaiting_response",
      "interview_internal",
      "sent_to_review",
      "sent_to_client",
    ];
    const stages = await Promise.all(stageSlugs.map((s) => getStage(s)));

    for (const s of stages) {
      await changeApplicationStage({
        applicationId: app.id,
        newStageId: s.id,
        changedById: null,
      });
    }

    const history = await testDb.applicationStatusHistory.findMany({
      where: { applicationId: app.id },
      orderBy: { changedAt: "asc" },
      include: { previousStage: true, newStage: true },
    });

    expect(history).toHaveLength(4);

    // Cadena coherente: previousStage de uno == newStage del anterior
    expect(history[0].previousStage?.slug).toBe("pending");
    expect(history[0].newStage.slug).toBe("awaiting_response");
    expect(history[1].previousStage?.slug).toBe("awaiting_response");
    expect(history[1].newStage.slug).toBe("interview_internal");
    expect(history[2].previousStage?.slug).toBe("interview_internal");
    expect(history[2].newStage.slug).toBe("sent_to_review");
    expect(history[3].previousStage?.slug).toBe("sent_to_review");
    expect(history[3].newStage.slug).toBe("sent_to_client");
  });
});
