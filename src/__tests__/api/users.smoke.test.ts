import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock } from "@/__tests__/setup/prisma-mock";
import "@/__tests__/setup/auth-mock";

const makeUser = (id: string, name: string) => ({
  id,
  name,
  email: `${name.toLowerCase().replace(" ", ".")}@test.local`,
  role: "recruiter" as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("Users API — smoke tests", () => {
  beforeEach(() => {
    prismaMock.user.findMany.mockResolvedValue([
      makeUser("u1", "Ana López"),
      makeUser("u2", "Carlos Ruiz"),
    ] as any);
  });

  it("GET /api/users returns 200 with user list", async () => {
    const { GET } = await import("@/app/api/users/route");
    const req = new NextRequest("http://localhost/api/users");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({ id: "u1", name: "Ana López" });
  });

  it("GET /api/users returns only id, name, email, role fields", async () => {
    const { GET } = await import("@/app/api/users/route");
    const req = new NextRequest("http://localhost/api/users");
    const res = await GET(req);
    const body = await res.json();

    const user = body.data[0];
    expect(user.id).toBeDefined();
    expect(user.name).toBeDefined();
    expect(user.email).toBeDefined();
    expect(user.role).toBeDefined();
  });
});

describe("Offer soft delete — smoke tests", () => {
  it("DELETE /api/offers/[id] on draft offer returns 200", async () => {
    const { DELETE } = await import("@/app/api/offers/[id]/route");
    const offerId = "a0000001-0000-4000-8000-000000000001";
    prismaMock.offer.findUnique.mockResolvedValue({
      id: offerId,
      status: "draft",
      archivedAt: null,
    } as any);
    prismaMock.offer.update.mockResolvedValue({ id: offerId, archivedAt: new Date() } as any);

    const req = new NextRequest(`http://localhost/api/offers/${offerId}`, { method: "DELETE" });
    const res = await DELETE(req, { params: { id: offerId } });
    expect(res.status).toBe(200);
  });

  it("DELETE /api/offers/[id] on published offer returns 403", async () => {
    const { DELETE } = await import("@/app/api/offers/[id]/route");
    const offerId = "a0000002-0000-4000-8000-000000000001";
    prismaMock.offer.findUnique.mockResolvedValue({
      id: offerId,
      status: "published",
      archivedAt: null,
    } as any);

    const req = new NextRequest(`http://localhost/api/offers/${offerId}`, { method: "DELETE" });
    const res = await DELETE(req, { params: { id: offerId } });
    expect(res.status).toBe(403);
  });

  it("DELETE /api/offers/[id] on non-existent offer returns 404", async () => {
    const { DELETE } = await import("@/app/api/offers/[id]/route");
    const nonExistentId = "f0000001-0000-4000-8000-000000000001";
    prismaMock.offer.findUnique.mockResolvedValue(null);

    const req = new NextRequest(`http://localhost/api/offers/${nonExistentId}`, { method: "DELETE" });
    const res = await DELETE(req, { params: { id: nonExistentId } });
    expect(res.status).toBe(404);
  });
});
