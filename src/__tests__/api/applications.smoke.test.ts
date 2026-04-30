import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/applications/route";
import { NextRequest } from "next/server";

describe("Applications API Smoke Tests", () => {
  it("GET /api/applications should return 200 and success format", async () => {
    const req = new NextRequest("http://localhost/api/applications");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
