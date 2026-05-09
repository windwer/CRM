import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("Health API", () => {
  it("GET /api/health returns 200 with status ok", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    expect(typeof body.version).toBe("string");
    expect(body.version.length).toBeGreaterThan(0);
    expect(typeof body.uptime_s).toBe("number");
  });
});
