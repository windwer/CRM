import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/gdpr/route";

describe("GDPR API Smoke Tests", () => {
  it("GET /api/gdpr should return 200 and success format", async () => {
    const request = new NextRequest("http://localhost/api/gdpr");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
