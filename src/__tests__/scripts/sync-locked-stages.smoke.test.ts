import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { testDb, resetTestDb, ensureSeedData } from "@/__tests__/setup/prisma-test-db";
import { createTestUser } from "@/__tests__/setup/factories";
import { syncLockedStages } from "../../../../database/scripts/sync-locked-stages";

describe("syncLockedStages smoke", () => {
  beforeAll(async () => {
    await ensureSeedData();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  it("fuerza locked=true en posiciones 1,8,9,10 y locked=false en 2-7 en template", async () => {
    // Manually corrupt the template: unlock pos 1 and 10, lock pos 3
    await testDb.pipelineStage.updateMany({
      where: { offerId: null, order: { in: [1, 10] } },
      data: { isLocked: false },
    });
    await testDb.pipelineStage.updateMany({
      where: { offerId: null, order: 3 },
      data: { isLocked: true },
    });

    const result = await syncLockedStages(testDb as any);

    expect(result.lockedUpdated).toBeGreaterThan(0);
    expect(result.unlockedUpdated).toBeGreaterThan(0);

    const stages = await testDb.pipelineStage.findMany({
      where: { offerId: null },
      orderBy: { order: "asc" },
    });

    for (const s of stages) {
      if ([1, 8, 9, 10].includes(s.order)) {
        expect(s.isLocked, `pos ${s.order} should be locked`).toBe(true);
      } else {
        expect(s.isLocked, `pos ${s.order} should NOT be locked`).toBe(false);
      }
    }
  });

  it("es idempotente: segunda ejecucion no cambia nada mas", async () => {
    // First sync to correct state
    const r1 = await syncLockedStages(testDb as any);
    // Second sync — nothing should change (already correct)
    const r2 = await syncLockedStages(testDb as any);

    expect(r2.lockedUpdated).toBe(0);
    expect(r2.unlockedUpdated).toBe(0);

    // Verify r1 made no changes either since seed data should already be correct
    // (or if it did, the state is now correct)
    const stages = await testDb.pipelineStage.findMany({ where: { offerId: null } });
    for (const s of stages) {
      if ([1, 8, 9, 10].includes(s.order)) {
        expect(s.isLocked).toBe(true);
      } else {
        expect(s.isLocked).toBe(false);
      }
    }
  });

  it("corrige stages de ofertas ademas del template", async () => {
    const user = await createTestUser({ role: "admin" });
    const offer = await testDb.offer.create({
      data: {
        title: "Sync Test Offer",
        description: "For sync test",
        location: "Remote",
        status: "published",
        createdBy: user.id,
      },
    });

    // Clone all 10 template stages to this offer
    const templateStages = await testDb.pipelineStage.findMany({
      where: { offerId: null },
      orderBy: { order: "asc" },
    });
    await testDb.pipelineStage.createMany({
      data: templateStages.map((s) => ({
        name: s.name, slug: s.slug, category: s.category, order: s.order,
        color: s.color, isDefault: false, isEditable: false, isActive: true,
        offerId: offer.id, isLocked: s.isLocked,
      })),
    });

    // Corrupt offer stages: unlock pos 1, lock pos 5
    await testDb.pipelineStage.updateMany({
      where: { offerId: offer.id, order: 1 },
      data: { isLocked: false },
    });
    await testDb.pipelineStage.updateMany({
      where: { offerId: offer.id, order: 5 },
      data: { isLocked: true },
    });

    await syncLockedStages(testDb as any);

    const offerStages = await testDb.pipelineStage.findMany({
      where: { offerId: offer.id },
      orderBy: { order: "asc" },
    });
    for (const s of offerStages) {
      if ([1, 8, 9, 10].includes(s.order)) {
        expect(s.isLocked, `offer pos ${s.order} should be locked`).toBe(true);
      } else {
        expect(s.isLocked, `offer pos ${s.order} should NOT be locked`).toBe(false);
      }
    }
  });
});
