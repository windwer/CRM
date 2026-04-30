import { describe, it, expect } from "vitest";
import { GET, POST } from "@/app/api/candidates/route";
import { NextRequest } from "next/server";

describe("Candidates API Smoke Tests", () => {
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
