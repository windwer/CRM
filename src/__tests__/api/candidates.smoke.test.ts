import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/candidates/route";
import { NextRequest } from "next/server";
import { prismaMock, setupTransactionMock } from "@/__tests__/setup/prisma-mock";
import "@/__tests__/setup/auth-mock";

describe("Candidates API Smoke Tests", () => {
  beforeEach(() => {
    setupTransactionMock();
    // GET /api/candidates usa $transaction([findMany, count])
    prismaMock.candidate.findMany.mockResolvedValue([]);
    prismaMock.candidate.count.mockResolvedValue(0);
    // POST /api/candidates usa $transaction(callback) con tx.candidate.create + tx.gDPRDeletionQueue.create
    prismaMock.candidate.create.mockResolvedValue({
      id: "test-candidate-id",
      email: "test@example.com",
      fullName: "Test Candidate",
      consentPersonalData: true,
      consentDate: new Date(),
      skillsArray: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    prismaMock.gDPRDeletionQueue.create.mockResolvedValue({
      id: "test-queue-id",
      candidateId: "test-candidate-id",
      status: "pending",
      deletionDate: new Date(),
      createdAt: new Date(),
    } as any);
  });

  it("GET /api/candidates should return 200 and success format", async () => {
    const req = new NextRequest("http://localhost/api/candidates");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("POST /api/candidates should return 200 and success format when valid", async () => {
    const candidateData = {
      email: "test@example.com",
      fullName: "Test Candidate",
      experienceYears: 5,
      seniorityLevel: "senior",
      consentPersonalData: true,
    };

    const req = new NextRequest("http://localhost/api/candidates", {
      method: "POST",
      body: JSON.stringify(candidateData),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });
});
