import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/offers/route";
import { NextRequest } from "next/server";
import { prismaMock, setupTransactionMock } from "@/__tests__/setup/prisma-mock";
import "@/__tests__/setup/auth-mock";

const MOCK_OFFERS = [
  { id: "o1", title: "Jefe de Proyecto de Infraestructura", status: "published", createdBy: "u1", createdAt: new Date(), updatedAt: new Date(), _count: { applications: 5 } },
  { id: "o2", title: "Tecnico IT", status: "published", createdBy: "u1", createdAt: new Date(), updatedAt: new Date(), _count: { applications: 3 } },
  { id: "o3", title: "Project Manager", status: "closed_hired", createdBy: "u1", createdAt: new Date(), updatedAt: new Date(), _count: { applications: 8 } },
];

describe("Funnel dropdown — offers API", () => {
  beforeEach(() => {
    setupTransactionMock();
    prismaMock.offer.findMany.mockResolvedValue(MOCK_OFFERS as any);
    prismaMock.offer.count.mockResolvedValue(3);
  });

  it("GET /api/offers (no filter) returns all offers for dropdown", async () => {
    const req = new NextRequest("http://localhost/api/offers");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(3);
    expect(body.data.map((o: any) => o.id)).toEqual(["o1", "o2", "o3"]);
  });

  it("GET /api/offers?status=published returns only published offers", async () => {
    prismaMock.offer.findMany.mockResolvedValue(MOCK_OFFERS.filter((o) => o.status === "published") as any);
    prismaMock.offer.count.mockResolvedValue(2);

    const req = new NextRequest("http://localhost/api/offers?status=published");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.data.every((o: any) => o.status === "published")).toBe(true);
  });

  it("GET /api/offers (no filter) provides id+title for all dropdown items (Todas + 3 offers = 4 items)", async () => {
    const req = new NextRequest("http://localhost/api/offers");
    const response = await GET(req);
    const body = await response.json();
    const offers: Array<{ id: string; title: string }> = body.data;

    // The dashboard renders: 1 "Todas las ofertas" + N offer items
    const dropdownItems = [{ id: "__all__", title: "Todas las ofertas" }, ...offers];
    expect(dropdownItems).toHaveLength(4);
    expect(dropdownItems[0].id).toBe("__all__");
    expect(dropdownItems.slice(1).every((o) => o.id && o.title)).toBe(true);
  });
});
