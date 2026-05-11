import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/offers/[id]/kanban/route";
import { NextRequest } from "next/server";
import { prismaMock } from "@/__tests__/setup/prisma-mock";
import "@/__tests__/setup/auth-mock";

const OFFER_ID = "a0000001-0000-4000-8000-000000000001";

const MOCK_OFFER = {
  id: OFFER_ID,
  title: "Test Offer",
  status: "published",
  assignedTo: { id: "user-1", name: "Maria Lopez" },
};

const MOCK_STAGES = [
  {
    id: "stage-1",
    name: "Pendiente",
    order: 1,
    color: "#94A3B8",
    isLocked: true,
    offerId: OFFER_ID,
    applications: [
      {
        id: "app-1",
        appliedAt: new Date(),
        aiScore: null,
        candidate: {
          id: "candidate-1",
          fullName: "Ines Rodriguez",
          email: "ines@example.com",
        },
      },
    ],
  },
  {
    id: "stage-2",
    name: "Entrevista",
    order: 3,
    color: "#6366F1",
    isLocked: false,
    offerId: OFFER_ID,
    applications: [],
  },
];

describe("Kanban API Smoke Tests", () => {
  beforeEach(() => {
    prismaMock.offer.findUnique.mockResolvedValue(MOCK_OFFER as any);
    prismaMock.pipelineStage.findMany.mockResolvedValue(MOCK_STAGES as any);
  });

  it("GET /api/offers/[id]/kanban returns 200 with expected shape", async () => {
    const req = new NextRequest(`http://localhost/api/offers/${OFFER_ID}/kanban`);
    const response = await GET(req, { params: { id: OFFER_ID } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.offer).toBeDefined();
    expect(body.data.stages).toBeDefined();
    expect(Array.isArray(body.data.stages)).toBe(true);
  });

  it("includes assignee with initials when offer has assignedTo", async () => {
    const req = new NextRequest(`http://localhost/api/offers/${OFFER_ID}/kanban`);
    const response = await GET(req, { params: { id: OFFER_ID } });
    const body = await response.json();

    expect(body.data.offer.assignee).not.toBeNull();
    expect(body.data.offer.assignee.name).toBe("Maria Lopez");
    expect(body.data.offer.assignee.initials).toBe("ML");
  });

  it("returns null assignee when offer has no assignedTo", async () => {
    prismaMock.offer.findUnique.mockResolvedValue({ ...MOCK_OFFER, assignedTo: null } as any);
    const req = new NextRequest(`http://localhost/api/offers/${OFFER_ID}/kanban`);
    const response = await GET(req, { params: { id: OFFER_ID } });
    const body = await response.json();

    expect(body.data.offer.assignee).toBeNull();
  });

  it("returns 404 when offer not found", async () => {
    prismaMock.offer.findUnique.mockResolvedValue(null);
    const req = new NextRequest(`http://localhost/api/offers/${OFFER_ID}/kanban`);
    const response = await GET(req, { params: { id: OFFER_ID } });

    expect(response.status).toBe(404);
  });

  it("generates candidate initials correctly", async () => {
    const req = new NextRequest(`http://localhost/api/offers/${OFFER_ID}/kanban`);
    const response = await GET(req, { params: { id: OFFER_ID } });
    const body = await response.json();

    const app = body.data.stages[0]?.applications[0];
    expect(app).toBeDefined();
    expect(app.candidate.initials).toBe("IR"); // Ines Rodriguez
  });
});
