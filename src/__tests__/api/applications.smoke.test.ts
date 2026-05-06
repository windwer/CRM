import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/applications/route";
import { NextRequest } from "next/server";
import { prismaMock, setupTransactionMock } from "@/__tests__/setup/prisma-mock";
import "@/__tests__/setup/auth-mock";

describe("Applications API Smoke Tests", () => {
  beforeEach(() => {
    setupTransactionMock();
    // GET /api/applications usa $transaction([findMany, count])
    prismaMock.application.findMany.mockResolvedValue([]);
    prismaMock.application.count.mockResolvedValue(0);
  });

  it("GET /api/applications should return 200 and success format", async () => {
    const req = new NextRequest("http://localhost/api/applications");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
