import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, setupTransactionMock } from "@/__tests__/setup/prisma-mock";
import "@/__tests__/setup/auth-mock";

const baseStages = [
  { id: "s1", slug: "prospect", name: "Prospecto", order: 1, offerId: null, color: "#6b7280", category: "funnel" },
  { id: "s2", slug: "interview", name: "Entrevista", order: 2, offerId: null, color: "#3b82f6", category: "funnel" },
  { id: "s3", slug: "hired", name: "Contratado", order: 8, offerId: null, color: "#10b981", category: "funnel" },
];

function setupBaseMocks() {
  prismaMock.offer.count.mockResolvedValue(5);
  prismaMock.candidate.count.mockResolvedValue(20);
  prismaMock.application.count.mockResolvedValue(10);
  prismaMock.application.aggregate.mockResolvedValue({ _avg: { aiScore: 72.5 } } as any);
  (prismaMock.gDPRDeletionQueue as any).count.mockResolvedValue(2);
  prismaMock.pipelineStage.findMany.mockResolvedValue(baseStages as any);
  prismaMock.application.groupBy.mockResolvedValue([
    { pipelineStageId: "s1", _count: { id: 8 } },
    { pipelineStageId: "s2", _count: { id: 3 } },
  ] as any);
  prismaMock.communication.findMany.mockResolvedValue([]);
  prismaMock.offer.findMany.mockResolvedValue([]);
}

describe("Dashboard stats API — smoke tests", () => {
  beforeEach(() => {
    setupTransactionMock();
    setupBaseMocks();
  });

  it("GET /api/dashboard/stats returns 200 with typed shape", async () => {
    const { GET } = await import("@/app/api/dashboard/stats/route");
    const req = new NextRequest("http://localhost/api/dashboard/stats");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.kpis).toBeDefined();
    expect(body.data.pipeline).toBeInstanceOf(Array);
    expect(body.data.recent_activity).toBeInstanceOf(Array);
    expect(body.data.top_offers).toBeInstanceOf(Array);
  });

  it("GET returns kpis with expected numeric fields", async () => {
    const { GET } = await import("@/app/api/dashboard/stats/route");
    const req = new NextRequest("http://localhost/api/dashboard/stats");
    const res = await GET(req);
    const { data } = await res.json();

    expect(typeof data.kpis.total_offers_active).toBe("number");
    expect(typeof data.kpis.total_candidates).toBe("number");
    expect(typeof data.kpis.total_applications).toBe("number");
    expect(typeof data.kpis.hired_this_month).toBe("number");
    expect(typeof data.kpis.avg_ai_score).toBe("number");
  });

  it("GET with valid offer_id filter passes without error", async () => {
    const { GET } = await import("@/app/api/dashboard/stats/route");
    const offerId = "a0000001-0000-4000-8000-000000000001";

    const req = new NextRequest(`http://localhost/api/dashboard/stats?offer_id=${offerId}`);
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("GET with invalid offer_id returns 400", async () => {
    const { GET } = await import("@/app/api/dashboard/stats/route");
    const req = new NextRequest("http://localhost/api/dashboard/stats?offer_id=not-a-uuid");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("Cache-Control header is set", async () => {
    const { GET } = await import("@/app/api/dashboard/stats/route");
    const req = new NextRequest("http://localhost/api/dashboard/stats");
    const res = await GET(req);
    const cacheHeader = res.headers.get("Cache-Control");
    expect(cacheHeader).toContain("private");
    expect(cacheHeader).toContain("max-age=300");
  });
});
