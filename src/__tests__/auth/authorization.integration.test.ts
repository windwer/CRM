/**
 * Authorization-by-role integration tests.
 *
 * Uses vi.mock directly in this file so hoisting applies here.
 * requireRole is mocked per-test via mockResolvedValueOnce.
 * 401/403 tests need no DB mock (endpoint returns before DB).
 * 200 (authorized path) tests set up minimal Prisma mocks.
 */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, setupTransactionMock } from "@/__tests__/setup/prisma-mock";

// ─── Mock auth-helpers in THIS file so hoisting applies ──────────────────────

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
}));

// Import AFTER vi.mock so we get the mocked version
import { requireRole } from "@/lib/auth-helpers";

// ─── Session fixtures ────────────────────────────────────────────────────────

const SESSION = {
  admin: {
    user: { id: "admin-id", email: "admin@test.local", name: "Admin", role: "admin" as const },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  recruiter: {
    user: { id: "recruiter-id", email: "recruiter@test.local", name: "Recruiter", role: "recruiter" as const },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  manager: {
    user: { id: "manager-id", email: "manager@test.local", name: "Manager", role: "manager" as const },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  viewer: {
    user: { id: "viewer-id", email: "viewer@test.local", name: "Viewer", role: "viewer" as const },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
};

const FORBIDDEN = Response.json(
  { success: false, error: { code: "FORBIDDEN", message: "No tienes permisos" } },
  { status: 403 }
);
const UNAUTHORIZED = Response.json(
  { success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } },
  { status: 401 }
);

const OFFER_UUID = "a0000001-0000-4000-8000-000000000001";
const APP_UUID   = "b0000001-0000-4000-8000-000000000001";
const STAGE_UUID = "c0000001-0000-4000-8000-000000000001";
const CAND_UUID  = "d0000001-0000-4000-8000-000000000001";

function asAuthorized(session: (typeof SESSION)[keyof typeof SESSION]) {
  vi.mocked(requireRole).mockResolvedValueOnce({ session } as any);
}
function asForbidden(session: (typeof SESSION)[keyof typeof SESSION]) {
  vi.mocked(requireRole).mockResolvedValueOnce({ session, errorResponse: FORBIDDEN } as any);
}
function asUnauthorized() {
  vi.mocked(requireRole).mockResolvedValueOnce({ session: null as any, errorResponse: UNAUTHORIZED });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Authorization by role", () => {
  beforeEach(() => {
    setupTransactionMock();
    // Default: admin authorized (overridden per-test)
    vi.mocked(requireRole).mockResolvedValue({ session: SESSION.admin } as any);
  });

  // ── 1. Unauthenticated (401) ────────────────────────────────────────────

  describe("Unauthenticated requests", () => {
    it("GET /api/offers without session returns 401", async () => {
      asUnauthorized();
      const { GET } = await import("@/app/api/offers/route");
      const res = await GET(new NextRequest("http://localhost/api/offers"));
      expect(res.status).toBe(401);
    });

    it("POST /api/offers without session returns 401", async () => {
      asUnauthorized();
      const { POST } = await import("@/app/api/offers/route");
      const res = await POST(
        new NextRequest("http://localhost/api/offers", { method: "POST", body: "{}" })
      );
      expect(res.status).toBe(401);
    });
  });

  // ── 2. VIEWER blocked from write endpoints (403) ────────────────────────

  describe("VIEWER cannot use write endpoints", () => {
    it("POST /api/offers as viewer returns 403", async () => {
      asForbidden(SESSION.viewer);
      const { POST } = await import("@/app/api/offers/route");
      const res = await POST(
        new NextRequest("http://localhost/api/offers", { method: "POST", body: "{}" })
      );
      expect(res.status).toBe(403);
    });

    it("DELETE /api/offers/[id] as viewer returns 403", async () => {
      asForbidden(SESSION.viewer);
      const { DELETE } = await import("@/app/api/offers/[id]/route");
      const res = await DELETE(
        new NextRequest(`http://localhost/api/offers/${OFFER_UUID}`, { method: "DELETE" }),
        { params: { id: OFFER_UUID } }
      );
      expect(res.status).toBe(403);
    });

    it("PATCH /api/applications/[id]/stage as viewer returns 403", async () => {
      asForbidden(SESSION.viewer);
      const { PATCH } = await import("@/app/api/applications/[id]/stage/route");
      const res = await PATCH(
        new NextRequest(`http://localhost/api/applications/${APP_UUID}/stage`, {
          method: "PATCH",
          body: JSON.stringify({ pipelineStageId: STAGE_UUID }),
        }),
        { params: { id: APP_UUID } }
      );
      expect(res.status).toBe(403);
    });

    it("POST /api/settings/pipelines as viewer returns 403", async () => {
      asForbidden(SESSION.viewer);
      const { POST } = await import("@/app/api/settings/pipelines/route");
      const res = await POST();
      expect(res.status).toBe(403);
    });

    it("POST /api/settings/users as viewer returns 403", async () => {
      asForbidden(SESSION.viewer);
      const { POST } = await import("@/app/api/settings/users/route");
      const res = await POST(
        new NextRequest("http://localhost/api/settings/users", { method: "POST", body: "{}" })
      );
      expect(res.status).toBe(403);
    });
  });

  // ── 3. RECRUITER blocked from admin-only endpoints (403) ────────────────

  describe("RECRUITER cannot use admin-only endpoints", () => {
    it("DELETE /api/offers/[id] as recruiter returns 403", async () => {
      asForbidden(SESSION.recruiter);
      const { DELETE } = await import("@/app/api/offers/[id]/route");
      const res = await DELETE(
        new NextRequest(`http://localhost/api/offers/${OFFER_UUID}`, { method: "DELETE" }),
        { params: { id: OFFER_UUID } }
      );
      expect(res.status).toBe(403);
    });

    it("DELETE /api/gdpr/[candidateId] as recruiter returns 403", async () => {
      asForbidden(SESSION.recruiter);
      const { DELETE } = await import("@/app/api/gdpr/[candidateId]/route");
      const res = await DELETE(
        new NextRequest(`http://localhost/api/gdpr/${CAND_UUID}`, { method: "DELETE" }),
        { params: { candidateId: CAND_UUID } }
      );
      expect(res.status).toBe(403);
    });

    it("DELETE /api/settings/pipelines/[id] as recruiter returns 403", async () => {
      asForbidden(SESSION.recruiter);
      const { DELETE } = await import("@/app/api/settings/pipelines/[id]/route");
      const res = await DELETE(
        new NextRequest(`http://localhost/api/settings/pipelines/${STAGE_UUID}`, { method: "DELETE" }),
        { params: { id: STAGE_UUID } }
      );
      expect(res.status).toBe(403);
    });
  });

  // ── 4. VIEWER can read (200) ────────────────────────────────────────────

  describe("VIEWER can access read-only endpoints", () => {
    it("GET /api/offers as viewer returns 200", async () => {
      asAuthorized(SESSION.viewer);
      prismaMock.offer.findMany.mockResolvedValue([]);
      prismaMock.offer.count.mockResolvedValue(0);
      const { GET } = await import("@/app/api/offers/route");
      const res = await GET(new NextRequest("http://localhost/api/offers"));
      expect(res.status).toBe(200);
    });

    it("GET /api/users as viewer returns 200", async () => {
      asAuthorized(SESSION.viewer);
      prismaMock.user.findMany.mockResolvedValue([]);
      const { GET } = await import("@/app/api/users/route");
      const res = await GET();
      expect(res.status).toBe(200);
    });
  });

  // ── 5. RECRUITER can use recruiter+ write endpoints (200) ───────────────

  describe("RECRUITER can use recruiter+ endpoints", () => {
    it("POST /api/offers as recruiter returns 200", async () => {
      asAuthorized(SESSION.recruiter);
      prismaMock.pipelineStage.findMany.mockResolvedValue([]);
      prismaMock.pipelineStage.createMany.mockResolvedValue({ count: 0 });
      prismaMock.offer.create.mockResolvedValue({
        id: OFFER_UUID, title: "Test Role", status: "published",
        createdBy: SESSION.recruiter.user.id, createdAt: new Date(), updatedAt: new Date(),
      } as any);
      const { POST } = await import("@/app/api/offers/route");
      const res = await POST(
        new NextRequest("http://localhost/api/offers", {
          method: "POST",
          body: JSON.stringify({ title: "Test Role", description: "Description long enough", location: "Remote", status: "published", assignedToUserId: OFFER_UUID }),
        })
      );
      expect(res.status).toBe(200);
    });
  });

  // ── 6. ADMIN can use admin-only endpoints (200) ─────────────────────────

  describe("ADMIN can use admin-only endpoints", () => {
    it("DELETE /api/offers/[id] as admin with draft offer returns 200", async () => {
      asAuthorized(SESSION.admin);
      prismaMock.offer.findUnique.mockResolvedValue({ id: OFFER_UUID, status: "draft" } as any);
      prismaMock.offer.update.mockResolvedValue({ id: OFFER_UUID } as any);
      const { DELETE } = await import("@/app/api/offers/[id]/route");
      const res = await DELETE(
        new NextRequest(`http://localhost/api/offers/${OFFER_UUID}`, { method: "DELETE" }),
        { params: { id: OFFER_UUID } }
      );
      expect(res.status).toBe(200);
    });
  });
});
