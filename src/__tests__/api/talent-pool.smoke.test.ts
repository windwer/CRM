import { describe, it, expect, beforeEach } from "vitest";
import { PATCH as patchTalentPool } from "@/app/api/candidates/[id]/talent-pool/route";
import { PATCH as patchBulkTalentPool } from "@/app/api/candidates/bulk-talent-pool/route";
import { NextRequest } from "next/server";
import { prismaMock, setupTransactionMock } from "@/__tests__/setup/prisma-mock";
import "@/__tests__/setup/auth-mock";

const VALID_CANDIDATE_ID = "a0000001-0000-4000-8000-000000000001";

const MOCK_CANDIDATE = {
  id: VALID_CANDIDATE_ID,
  email: "test@example.com",
  fullName: "Test Candidate",
  talentPoolStatus: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

describe("Talent Pool API Smoke Tests", () => {
  beforeEach(() => {
    setupTransactionMock();
    prismaMock.candidate.findUnique.mockResolvedValue(MOCK_CANDIDATE);
    prismaMock.candidate.update.mockResolvedValue({
      ...MOCK_CANDIDATE,
      talentPoolStatus: "may_fit_future",
    });
    prismaMock.candidate.updateMany.mockResolvedValue({ count: 2 });
  });

  describe("PATCH /api/candidates/[id]/talent-pool", () => {
    it("should update talent_pool_status to valid value", async () => {
      const req = new NextRequest(
        `http://localhost/api/candidates/${VALID_CANDIDATE_ID}/talent-pool`,
        {
          method: "PATCH",
          body: JSON.stringify({ talent_pool_status: "may_fit_future" }),
        }
      );
      const response = await patchTalentPool(req, { params: { id: VALID_CANDIDATE_ID } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("should return 400 for invalid talent_pool_status", async () => {
      const req = new NextRequest(
        `http://localhost/api/candidates/${VALID_CANDIDATE_ID}/talent-pool`,
        {
          method: "PATCH",
          body: JSON.stringify({ talent_pool_status: "invalid_status" }),
        }
      );
      const response = await patchTalentPool(req, { params: { id: VALID_CANDIDATE_ID } });
      expect(response.status).toBe(400);
    });

    it("should return 404 when candidate not found", async () => {
      prismaMock.candidate.findUnique.mockResolvedValue(null);
      const req = new NextRequest(
        `http://localhost/api/candidates/${VALID_CANDIDATE_ID}/talent-pool`,
        {
          method: "PATCH",
          body: JSON.stringify({ talent_pool_status: "active" }),
        }
      );
      const response = await patchTalentPool(req, { params: { id: VALID_CANDIDATE_ID } });
      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/candidates/bulk-talent-pool", () => {
    const VALID_IDS = [
      "a0000001-0000-4000-8000-000000000001",
      "a0000002-0000-4000-8000-000000000002",
    ];

    it("should bulk update talent_pool_status", async () => {
      const req = new NextRequest("http://localhost/api/candidates/bulk-talent-pool", {
        method: "PATCH",
        body: JSON.stringify({
          candidate_ids: VALID_IDS,
          talent_pool_status: "discarded",
        }),
      });
      const response = await patchBulkTalentPool(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.updated).toBe(2);
      expect(body.data.talent_pool_status).toBe("discarded");
    });

    it("should return 400 for empty candidate_ids", async () => {
      const req = new NextRequest("http://localhost/api/candidates/bulk-talent-pool", {
        method: "PATCH",
        body: JSON.stringify({
          candidate_ids: [],
          talent_pool_status: "active",
        }),
      });
      const response = await patchBulkTalentPool(req);
      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid UUIDs", async () => {
      const req = new NextRequest("http://localhost/api/candidates/bulk-talent-pool", {
        method: "PATCH",
        body: JSON.stringify({
          candidate_ids: ["not-a-uuid"],
          talent_pool_status: "active",
        }),
      });
      const response = await patchBulkTalentPool(req);
      expect(response.status).toBe(400);
    });
  });
});
