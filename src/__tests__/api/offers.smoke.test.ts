import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/offers/route";
import { NextRequest } from "next/server";
import { prismaMock, setupTransactionMock } from "@/__tests__/setup/prisma-mock";
import "@/__tests__/setup/auth-mock";

describe("Offers API Smoke Tests", () => {
  beforeEach(() => {
    setupTransactionMock();
    // GET /api/offers usa $transaction([findMany, count])
    prismaMock.offer.findMany.mockResolvedValue([]);
    prismaMock.offer.count.mockResolvedValue(0);
    // POST /api/offers usa offer.create directamente
    prismaMock.offer.create.mockResolvedValue({
      id: "test-offer-id",
      title: "Software Engineer",
      description: "A great job for a great engineer",
      location: "Remote",
      status: "published",
      createdBy: "test-admin-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    prismaMock.pipelineStage.findMany.mockResolvedValue([]);
  });

  it("GET /api/offers should return 200 and success format", async () => {
    const req = new NextRequest("http://localhost/api/offers");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("POST /api/offers should return 200 and success format when valid", async () => {
    const offerData = {
      title: "Software Engineer",
      description: "A great job for a great engineer",
      location: "Remote",
      status: "published",
      assignedToUserId: "a0000001-0000-4000-8000-000000000001",
    };

    const req = new NextRequest("http://localhost/api/offers", {
      method: "POST",
      body: JSON.stringify(offerData),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });
});
