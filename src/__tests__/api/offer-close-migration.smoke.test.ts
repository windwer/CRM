import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, setupTransactionMock } from "@/__tests__/setup/prisma-mock";
import "@/__tests__/setup/auth-mock";

const OFFER_ID = "a0000001-0000-4000-8000-000000000001";
const CANDIDATE_ID = "d0000001-0000-4000-8000-000000000001";
const APP_ID = "e0000001-0000-4000-8000-000000000001";

const makeMayFitStage = () => ({
  id: "stage-may-fit",
  offerId: OFFER_ID,
  name: "Posible fit futuro",
  slug: "may_fit_future",
  order: 7,
  color: "#8b5cf6",
  category: "funnel",
  isLocked: false,
  isEditable: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeApplication = () => ({
  id: APP_ID,
  candidateId: CANDIDATE_ID,
  offerId: OFFER_ID,
  pipelineStageId: "stage-may-fit",
  candidate: { id: CANDIDATE_ID, fullName: "Ana García", email: "ana@test.local" },
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("Offer close/confirm API — smoke tests", () => {
  beforeEach(() => {
    setupTransactionMock();
  });

  it("POST /close returns requires_confirmation when may_fit_future candidates exist", async () => {
    const { POST } = await import("@/app/api/offers/[id]/close/route");
    prismaMock.offer.findUnique.mockResolvedValue({ id: OFFER_ID, status: "published" } as any);
    prismaMock.pipelineStage.findFirst.mockResolvedValue(makeMayFitStage() as any);
    prismaMock.application.findMany.mockResolvedValue([makeApplication()] as any);

    const req = new NextRequest(`http://localhost/api/offers/${OFFER_ID}/close`, {
      method: "POST",
    });
    const res = await POST(req, { params: { id: OFFER_ID } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.requires_confirmation).toBe(true);
    expect(body.data.candidates_to_migrate).toHaveLength(1);
    expect(body.data.candidates_to_migrate[0].full_name).toBe("Ana García");
  });

  it("POST /close closes directly when no may_fit_future stage exists", async () => {
    const { POST } = await import("@/app/api/offers/[id]/close/route");
    prismaMock.offer.findUnique.mockResolvedValue({ id: OFFER_ID, status: "published" } as any);
    prismaMock.pipelineStage.findFirst.mockResolvedValue(null);
    prismaMock.offer.update.mockResolvedValue({ id: OFFER_ID, status: "closed_no_hire" } as any);

    const req = new NextRequest(`http://localhost/api/offers/${OFFER_ID}/close`, {
      method: "POST",
    });
    const res = await POST(req, { params: { id: OFFER_ID } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.requires_confirmation).toBe(false);
  });

  it("POST /close/confirm migrates candidates and closes offer", async () => {
    const { POST } = await import("@/app/api/offers/[id]/close/confirm/route");
    prismaMock.offer.findUnique.mockResolvedValue({ id: OFFER_ID, status: "published" } as any);
    prismaMock.pipelineStage.findFirst.mockResolvedValue(makeMayFitStage() as any);
    prismaMock.application.findMany.mockResolvedValue([{ candidateId: CANDIDATE_ID }] as any);
    prismaMock.candidate.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.offer.update.mockResolvedValue({ id: OFFER_ID, status: "closed_no_hire" } as any);

    const req = new NextRequest(`http://localhost/api/offers/${OFFER_ID}/close/confirm`, {
      method: "POST",
      body: JSON.stringify({ confirmed: true }),
    });
    const res = await POST(req, { params: { id: OFFER_ID } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.success).toBe(true);
    expect(body.data.migrated).toBeGreaterThanOrEqual(0);
  });

  it("POST /close/confirm requires confirmed=true", async () => {
    const { POST } = await import("@/app/api/offers/[id]/close/confirm/route");
    prismaMock.offer.findUnique.mockResolvedValue({ id: OFFER_ID, status: "published" } as any);

    const req = new NextRequest(`http://localhost/api/offers/${OFFER_ID}/close/confirm`, {
      method: "POST",
      body: JSON.stringify({ confirmed: false }),
    });
    const res = await POST(req, { params: { id: OFFER_ID } });
    expect(res.status).toBe(400);
  });
});
