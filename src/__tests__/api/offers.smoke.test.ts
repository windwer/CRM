import { describe, it, expect } from "vitest";
import { GET, POST } from "@/app/api/offers/route";
import { NextRequest } from "next/server";

describe("Offers API Smoke Tests", () => {
  it("GET /api/offers should return 200 and success format", async () => {
    const req = new NextRequest("http://localhost/api/offers");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("POST /api/offers should return 200 and success format when valid", async () => {
    const offerData = {
      title: "Software Engineer",
      description: "A great job for a great engineer",
      department: "Engineering",
      location: "Remote",
      status: "published",
    };

    const req = new NextRequest("http://localhost/api/offers", {
      method: "POST",
      body: JSON.stringify(offerData),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });
});
