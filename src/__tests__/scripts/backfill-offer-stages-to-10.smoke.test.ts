import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { testDb, resetTestDb, ensureSeedData } from "@/__tests__/setup/prisma-test-db";
import { createTestUser } from "@/__tests__/setup/factories";
import { backfillOfferStagesToTen } from "../../../../database/scripts/backfill-offer-stages-to-10";

describe("backfillOfferStagesToTen smoke", () => {
  beforeAll(async () => {
    await ensureSeedData();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  it("añade los 6 stages intermedios a una oferta con solo 4 locked", async () => {
    const user = await createTestUser({ role: "admin" });
    const offer = await testDb.offer.create({
      data: {
        title: "Backfill To 10 Test",
        description: "Testing full 10-stage backfill",
        location: "Remote",
        status: "published",
        createdBy: user.id,
      },
    });

    // Simulate offer that only has the 4 locked stages (legacy state)
    const lockedTemplates = await testDb.pipelineStage.findMany({
      where: { offerId: null, isLocked: true },
      orderBy: { order: "asc" },
    });
    await testDb.pipelineStage.createMany({
      data: lockedTemplates.map((s) => ({
        name: s.name, slug: s.slug, category: s.category, order: s.order,
        color: s.color, isDefault: false, isEditable: false, isActive: true,
        offerId: offer.id, isLocked: true,
      })),
    });

    const before = await testDb.pipelineStage.count({ where: { offerId: offer.id } });
    expect(before).toBe(4);

    await backfillOfferStagesToTen(testDb as any);

    // Check the specific offer — must have 10 stages regardless of other offers in DB
    const allStages = await testDb.pipelineStage.findMany({
      where: { offerId: offer.id },
      orderBy: { order: "asc" },
    });
    expect(allStages).toHaveLength(10);
    expect(allStages.filter((s) => s.isLocked)).toHaveLength(4);
    expect(allStages.filter((s) => !s.isLocked)).toHaveLength(6);
    expect(allStages.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("es idempotente: segunda ejecución no duplica stages", async () => {
    const user = await createTestUser({ role: "admin" });
    const offer = await testDb.offer.create({
      data: {
        title: "Idempotency Test 10 Stages",
        description: "Testing idempotency",
        location: "Remote",
        status: "published",
        createdBy: user.id,
      },
    });

    const lockedTemplates = await testDb.pipelineStage.findMany({
      where: { offerId: null, isLocked: true },
      orderBy: { order: "asc" },
    });
    await testDb.pipelineStage.createMany({
      data: lockedTemplates.map((s) => ({
        name: s.name, slug: s.slug, category: s.category, order: s.order,
        color: s.color, isDefault: false, isEditable: false, isActive: true,
        offerId: offer.id, isLocked: true,
      })),
    });

    await backfillOfferStagesToTen(testDb as any);

    const afterFirst = await testDb.pipelineStage.count({ where: { offerId: offer.id } });
    expect(afterFirst).toBe(10);

    // Second run — must be idempotent
    const r2 = await backfillOfferStagesToTen(testDb as any);
    // This specific offer should be skipped (already has all 10 slugs)
    const detail = r2.details.find((d) => d.offerTitle === "Idempotency Test 10 Stages");
    expect(detail?.skipped).toBe(true);
    expect(detail?.added).toBe(0);

    const afterSecond = await testDb.pipelineStage.count({ where: { offerId: offer.id } });
    expect(afterSecond).toBe(10);
  });

  it("añade los 10 stages a una oferta con 0 stages (caso smartcrm_pro)", async () => {
    const user = await createTestUser({ role: "admin" });
    const offer = await testDb.offer.create({
      data: {
        title: "Zero Stages Offer",
        description: "Offer with no stages at all",
        location: "Remote",
        status: "published",
        createdBy: user.id,
      },
    });

    const before = await testDb.pipelineStage.count({ where: { offerId: offer.id } });
    expect(before).toBe(0);

    await backfillOfferStagesToTen(testDb as any);

    const allStages = await testDb.pipelineStage.findMany({
      where: { offerId: offer.id },
    });
    expect(allStages).toHaveLength(10);
  });
});
