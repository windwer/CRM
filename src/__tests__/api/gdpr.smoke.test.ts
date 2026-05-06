import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/gdpr/route";
import { prismaMock, setupTransactionMock } from "@/__tests__/setup/prisma-mock";
import "@/__tests__/setup/auth-mock";

describe("GDPR API Smoke Tests", () => {
  beforeEach(() => {
    setupTransactionMock();
    // GET /api/gdpr usa $transaction([gDPRDeletionQueue.findMany, gDPRDeletionQueue.count])
    prismaMock.gDPRDeletionQueue.findMany.mockResolvedValue([]);
    prismaMock.gDPRDeletionQueue.count.mockResolvedValue(0);
  });

  it("GET /api/gdpr should return 200 and success format", async () => {
    const request = new NextRequest("http://localhost/api/gdpr");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
