import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, setupTransactionMock } from "@/__tests__/setup/prisma-mock";
import "@/__tests__/setup/auth-mock";

const OFFER_ID = "a0000001-0000-4000-8000-000000000001";
const STAGE_ID = "b0000001-0000-4000-8000-000000000001";
const LOCKED_STAGE_ID = "c0000001-0000-4000-8000-000000000001";

const makeLockedStage = (id = LOCKED_STAGE_ID, order = 1) => ({
  id,
  offerId: OFFER_ID,
  name: "Prospecto",
  slug: "prospect",
  order,
  color: "#6b7280",
  category: "funnel",
  isLocked: true,
  isEditable: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeStage = (id = STAGE_ID, order = 2) => ({
  id,
  offerId: OFFER_ID,
  name: "En revisión",
  slug: "en_revision",
  order,
  color: "#3b82f6",
  category: "funnel",
  isLocked: false,
  isEditable: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("Pipeline stages API — smoke tests", () => {
  beforeEach(() => {
    setupTransactionMock();
  });

  // ─── POST /api/offers/[id]/pipeline/stages ─────────────────────────────────

  it("POST with valid name+position returns 200", async () => {
    const { POST } = await import("@/app/api/offers/[id]/pipeline/stages/route");
    prismaMock.offer.findUnique.mockResolvedValue({ id: OFFER_ID, status: "published" } as any);
    prismaMock.pipelineStage.findMany.mockResolvedValue([makeLockedStage()]);
    prismaMock.pipelineStage.create.mockResolvedValue(makeStage());

    const req = new NextRequest(`http://localhost/api/offers/${OFFER_ID}/pipeline/stages`, {
      method: "POST",
      body: JSON.stringify({ name: "En revisión", position: 2 }),
    });
    const res = await POST(req, { params: { id: OFFER_ID } });
    expect(res.status).toBe(200);
  });

  it("POST with position=1 (locked) returns 400", async () => {
    const { POST } = await import("@/app/api/offers/[id]/pipeline/stages/route");
    prismaMock.offer.findUnique.mockResolvedValue({ id: OFFER_ID, status: "published" } as any);
    prismaMock.pipelineStage.findMany.mockResolvedValue([makeLockedStage()]);

    const req = new NextRequest(`http://localhost/api/offers/${OFFER_ID}/pipeline/stages`, {
      method: "POST",
      body: JSON.stringify({ name: "Test", position: 1 }),
    });
    const res = await POST(req, { params: { id: OFFER_ID } });
    expect(res.status).toBe(400);
  });

  it("POST when 6 intermediates already exist returns 400", async () => {
    const { POST } = await import("@/app/api/offers/[id]/pipeline/stages/route");
    prismaMock.offer.findUnique.mockResolvedValue({ id: OFFER_ID, status: "published" } as any);
    const sixIntermediates = [2, 3, 4, 5, 6, 7].map((order) => makeStage(`stage-${order}`, order));
    prismaMock.pipelineStage.findMany.mockResolvedValue([makeLockedStage(), ...sixIntermediates]);

    const req = new NextRequest(`http://localhost/api/offers/${OFFER_ID}/pipeline/stages`, {
      method: "POST",
      body: JSON.stringify({ name: "Extra", position: 2 }),
    });
    const res = await POST(req, { params: { id: OFFER_ID } });
    expect(res.status).toBe(400);
  });

  // ─── PATCH /api/offers/[id]/pipeline/stages/[stageId] ─────────────────────

  it("PATCH on locked stage returns 403", async () => {
    const { PATCH } = await import("@/app/api/offers/[id]/pipeline/stages/[stageId]/route");
    prismaMock.pipelineStage.findFirst.mockResolvedValue(makeLockedStage() as any);

    const req = new NextRequest(
      `http://localhost/api/offers/${OFFER_ID}/pipeline/stages/${LOCKED_STAGE_ID}`,
      { method: "PATCH", body: JSON.stringify({ name: "Nuevo nombre" }) }
    );
    const res = await PATCH(req, { params: { id: OFFER_ID, stageId: LOCKED_STAGE_ID } });
    expect(res.status).toBe(403);
  });

  // ─── DELETE /api/offers/[id]/pipeline/stages/[stageId] ────────────────────

  it("DELETE on locked stage returns 403", async () => {
    const { DELETE } = await import("@/app/api/offers/[id]/pipeline/stages/[stageId]/route");
    prismaMock.pipelineStage.findFirst.mockResolvedValue(makeLockedStage() as any);

    const req = new NextRequest(
      `http://localhost/api/offers/${OFFER_ID}/pipeline/stages/${LOCKED_STAGE_ID}`,
      { method: "DELETE" }
    );
    const res = await DELETE(req, { params: { id: OFFER_ID, stageId: LOCKED_STAGE_ID } });
    expect(res.status).toBe(403);
  });

  it("DELETE with candidates in stage returns 409 with candidate_count", async () => {
    const { DELETE } = await import("@/app/api/offers/[id]/pipeline/stages/[stageId]/route");
    prismaMock.pipelineStage.findFirst.mockResolvedValue(makeStage() as any);
    prismaMock.application.count.mockResolvedValue(3);

    const req = new NextRequest(
      `http://localhost/api/offers/${OFFER_ID}/pipeline/stages/${STAGE_ID}`,
      { method: "DELETE" }
    );
    const res = await DELETE(req, { params: { id: OFFER_ID, stageId: STAGE_ID } });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.candidate_count).toBe(3);
  });

  it("DELETE with no candidates returns 204", async () => {
    const { DELETE } = await import("@/app/api/offers/[id]/pipeline/stages/[stageId]/route");
    prismaMock.pipelineStage.findFirst.mockResolvedValue(makeStage() as any);
    prismaMock.application.count.mockResolvedValue(0);
    prismaMock.pipelineStage.delete.mockResolvedValue(makeStage() as any);

    const req = new NextRequest(
      `http://localhost/api/offers/${OFFER_ID}/pipeline/stages/${STAGE_ID}`,
      { method: "DELETE" }
    );
    const res = await DELETE(req, { params: { id: OFFER_ID, stageId: STAGE_ID } });
    expect(res.status).toBe(204);
  });
});
