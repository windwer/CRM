import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { testDb, resetTestDb, ensureSeedData } from "@/__tests__/setup/prisma-test-db";
import { createTestUser } from "@/__tests__/setup/factories";
import { backfillOfferPipelines } from "../../../../database/scripts/backfill-offer-pipelines";

describe("backfillOfferPipelines smoke", () => {
  beforeAll(async () => {
    await ensureSeedData();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  it("clona 4 stages locked por oferta nueva", async () => {
    const user = await createTestUser({ role: "admin" });
    const offer = await testDb.offer.create({
      data: {
        title: "Backfill Test Offer",
        description: "Testing backfill pipeline cloning",
        location: "Remote",
        status: "published",
        createdBy: user.id,
      },
    });

    const result = await backfillOfferPipelines(testDb as any);

    expect(result.cloned).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toBe(0);

    const stages = await testDb.pipelineStage.findMany({
      where: { offerId: offer.id, isLocked: true },
      orderBy: { order: "asc" },
    });
    expect(stages).toHaveLength(4);
    expect(stages.map((s) => s.order)).toEqual([1, 8, 9, 10]);
    expect(stages.every((s) => s.isLocked)).toBe(true);
    expect(stages.every((s) => s.offerId === offer.id)).toBe(true);
  });

  it("es idempotente: segunda ejecución no duplica stages", async () => {
    const user = await createTestUser({ role: "admin" });
    await testDb.offer.create({
      data: {
        title: "Idempotency Test Offer",
        description: "Testing backfill idempotency check",
        location: "Remote",
        status: "published",
        createdBy: user.id,
      },
    });

    const r1 = await backfillOfferPipelines(testDb as any);
    expect(r1.cloned).toBe(1);

    const r2 = await backfillOfferPipelines(testDb as any);
    expect(r2.cloned).toBe(0);
    expect(r2.skipped).toBe(1);

    const allOfferStages = await testDb.pipelineStage.findMany({
      where: { offerId: { not: null } },
    });
    expect(allOfferStages).toHaveLength(4);
  });
});
