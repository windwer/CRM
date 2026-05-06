import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { testDb, resetTestDb, ensureSeedData } from "@/__tests__/setup/prisma-test-db";
import {
  createTestUser,
  createOfferWithApplications,
  getStage,
} from "@/__tests__/setup/factories";
import { closeOffer, reopenOffer } from "@/lib/offer-close";

// closeOffer y reopenOffer reciben tx directamente — no necesitan override de @/lib/db.
// Todas las llamadas se envuelven en testDb.$transaction().

describe("closeOffer integration", () => {
  beforeAll(async () => {
    await ensureSeedData();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  // === CASOS FELICES ===

  it("cierra oferta como closed_hired con transaccion atomica", async () => {
    const admin = await createTestUser({ role: "admin" });
    const { offer, applications } = await createOfferWithApplications({
      stageDistribution: {
        pending: 2,
        interview_internal: 1,
        sent_to_review: 1,
      },
    });

    const interviewStage = await getStage("interview_internal");
    const hiredApp = applications.find((a) => a.pipelineStageId === interviewStage.id)!;

    await testDb.$transaction(async (tx) => {
      await closeOffer({
        offerId: offer.id,
        status: "closed_hired",
        hiredApplicationId: hiredApp.id,
        closedById: admin.id,
        oldStatus: "published",
        tx,
      });
    });

    const offerAfter = await testDb.offer.findUnique({ where: { id: offer.id } });
    expect(offerAfter?.status).toBe("closed_hired");
    expect(offerAfter?.hiredApplicationId).toBe(hiredApp.id);
    expect(offerAfter?.closedAt).toBeInstanceOf(Date);
    expect(offerAfter?.closedById).toBe(admin.id);

    // Application contratada movida a stage 'hired'
    const hiredAppAfter = await testDb.application.findUnique({
      where: { id: hiredApp.id },
      include: { pipelineStage: true },
    });
    expect(hiredAppAfter?.pipelineStage.slug).toBe("hired");

    // Resto de applications (no done) devueltas a 'pending'
    const pendingStage = await getStage("pending");
    const restApps = await testDb.application.findMany({
      where: { offerId: offer.id, id: { not: hiredApp.id } },
    });
    for (const a of restApps) {
      expect(a.pipelineStageId).toBe(pendingStage.id);
    }

    // OfferChange registrado con fieldName correcto
    const changes = await testDb.offerChange.findMany({ where: { offerId: offer.id } });
    expect(changes.length).toBeGreaterThan(0);
    expect(changes.some((c) => c.fieldName === "status")).toBe(true);
  });

  it("cierra oferta sin contratacion (closed_no_hire)", async () => {
    const admin = await createTestUser({ role: "admin" });
    const { offer } = await createOfferWithApplications({
      stageDistribution: { pending: 3, interview_internal: 2 },
    });

    await testDb.$transaction(async (tx) => {
      await closeOffer({
        offerId: offer.id,
        status: "closed_no_hire",
        closedById: admin.id,
        oldStatus: "published",
        tx,
      });
    });

    const offerAfter = await testDb.offer.findUnique({ where: { id: offer.id } });
    expect(offerAfter?.status).toBe("closed_no_hire");
    expect(offerAfter?.hiredApplicationId).toBeNull();

    // Todas las applications no done devueltas a 'pending'
    const pendingStage = await getStage("pending");
    const allApps = await testDb.application.findMany({ where: { offerId: offer.id } });
    for (const a of allApps) {
      expect(a.pipelineStageId).toBe(pendingStage.id);
    }
  });

  it("reabre oferta closed_no_hire correctamente", async () => {
    const admin = await createTestUser({ role: "admin" });
    const { offer } = await createOfferWithApplications({
      stageDistribution: { pending: 2 },
    });

    await testDb.$transaction(async (tx) => {
      await closeOffer({
        offerId: offer.id,
        status: "closed_no_hire",
        closedById: admin.id,
        oldStatus: "published",
        tx,
      });
    });
    await testDb.$transaction(async (tx) => {
      await reopenOffer({ offerId: offer.id, reopenedById: admin.id, tx });
    });

    const offerAfter = await testDb.offer.findUnique({ where: { id: offer.id } });
    expect(offerAfter?.status).toBe("published");
    expect(offerAfter?.closedAt).toBeNull();
    expect(offerAfter?.reopenedAt).toBeInstanceOf(Date);
    expect(offerAfter?.reopenedById).toBe(admin.id);
  });

  // === CASOS DE ERROR ===

  it("falla si hiredApplicationId no pertenece a la oferta (rollback)", async () => {
    const admin = await createTestUser({ role: "admin" });
    const { offer } = await createOfferWithApplications({ applicationCount: 2 });
    const otroOffer = await createOfferWithApplications({ applicationCount: 1 });
    const aplicacionAjena = otroOffer.applications[0];

    await expect(
      testDb.$transaction(async (tx) => {
        await closeOffer({
          offerId: offer.id,
          status: "closed_hired",
          hiredApplicationId: aplicacionAjena.id,
          closedById: admin.id,
          oldStatus: "published",
          tx,
        });
      })
    ).rejects.toThrow("HIRED_APPLICATION_NOT_IN_OFFER");

    // Transaccion hizo rollback — oferta sin cambios
    const offerAfter = await testDb.offer.findUnique({ where: { id: offer.id } });
    expect(offerAfter?.status).toBe("published");
    expect(offerAfter?.hiredApplicationId).toBeNull();
  });

  it("rechaza reabrir una oferta closed_hired (permanente)", async () => {
    const admin = await createTestUser({ role: "admin" });
    const { offer, applications } = await createOfferWithApplications({
      applicationCount: 1,
    });

    await testDb.$transaction(async (tx) => {
      await closeOffer({
        offerId: offer.id,
        status: "closed_hired",
        hiredApplicationId: applications[0].id,
        closedById: admin.id,
        oldStatus: "published",
        tx,
      });
    });

    await expect(
      testDb.$transaction(async (tx) => {
        await reopenOffer({ offerId: offer.id, reopenedById: admin.id, tx });
      })
    ).rejects.toThrow("OFFER_CANNOT_BE_REOPENED");
  });

  // === CONCURRENCIA LOGICA ===

  it("dos cierres simultaneos en ofertas distintas no interfieren", async () => {
    const admin = await createTestUser({ role: "admin" });
    const off1 = await createOfferWithApplications({ applicationCount: 1 });
    const off2 = await createOfferWithApplications({ applicationCount: 1 });

    await Promise.all([
      testDb.$transaction(async (tx) => {
        await closeOffer({
          offerId: off1.offer.id,
          status: "closed_hired",
          hiredApplicationId: off1.applications[0].id,
          closedById: admin.id,
          oldStatus: "published",
          tx,
        });
      }),
      testDb.$transaction(async (tx) => {
        await closeOffer({
          offerId: off2.offer.id,
          status: "closed_hired",
          hiredApplicationId: off2.applications[0].id,
          closedById: admin.id,
          oldStatus: "published",
          tx,
        });
      }),
    ]);

    const off1After = await testDb.offer.findUnique({ where: { id: off1.offer.id } });
    const off2After = await testDb.offer.findUnique({ where: { id: off2.offer.id } });
    expect(off1After?.status).toBe("closed_hired");
    expect(off2After?.status).toBe("closed_hired");
  });
});
