import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/gdpr/route";

describe("GDPR API Smoke Tests", () => {
  it("GET /api/gdpr should return 200 and success format", async () => {
    // Note: GET doesn't take req in our implementation (it was removed to fix lint)
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
