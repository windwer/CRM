import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/offers/route";
import { NextRequest } from "next/server";
import { prismaMock, setupTransactionMock } from "@/__tests__/setup/prisma-mock";
import "@/__tests__/setup/auth-mock";

const MOCK_TEMPLATE_STAGES = [
  { id: "t1", name: "Pendiente",                     slug: "pending",              order: 1,  color: "#94A3B8", isLocked: true,  category: null, isDefault: false, isEditable: false, isActive: true, offerId: null },
  { id: "t2", name: "Pdte respuesta",                slug: "awaiting_response",    order: 2,  color: "#64748B", isLocked: false, category: null, isDefault: false, isEditable: false, isActive: true, offerId: null },
  { id: "t3", name: "Convocado a entrevista",        slug: "interview_internal",   order: 3,  color: "#3B82F6", isLocked: false, category: null, isDefault: false, isEditable: false, isActive: true, offerId: null },
  { id: "t4", name: "Pdte feedback Victor y Pilar",  slug: "sent_to_review",       order: 4,  color: "#8B5CF6", isLocked: false, category: null, isDefault: false, isEditable: false, isActive: true, offerId: null },
  { id: "t5", name: "Enviado a cliente",             slug: "sent_to_client",       order: 5,  color: "#F59E0B", isLocked: false, category: null, isDefault: false, isEditable: false, isActive: true, offerId: null },
  { id: "t6", name: "Pdte feedback cliente",         slug: "sent_to_review_client",order: 6,  color: "#F97316", isLocked: false, category: null, isDefault: false, isEditable: false, isActive: true, offerId: null },
  { id: "t7", name: "Entrevista con cliente agendada", slug: "interview_client",   order: 7,  color: "#A855F7", isLocked: false, category: null, isDefault: false, isEditable: false, isActive: true, offerId: null },
  { id: "t8", name: "Contratado",                    slug: "hired",                order: 8,  color: "#10B981", isLocked: true,  category: null, isDefault: false, isEditable: false, isActive: true, offerId: null },
  { id: "t9", name: "Puede encajar a futuro",        slug: "may_fit_future",       order: 9,  color: "#8B5CF6", isLocked: true,  category: null, isDefault: false, isEditable: false, isActive: true, offerId: null },
  { id: "t10",name: "Descartado",                    slug: "rejected",             order: 10, color: "#EF4444", isLocked: true,  category: null, isDefault: false, isEditable: false, isActive: true, offerId: null },
];

describe("Offers API Smoke Tests", () => {
  beforeEach(() => {
    setupTransactionMock();
    prismaMock.offer.findMany.mockResolvedValue([]);
    prismaMock.offer.count.mockResolvedValue(0);
    prismaMock.offer.create.mockResolvedValue({
      id: "test-offer-id",
      title: "Software Engineer",
      description: "A great job for a great engineer",
      location: "Remote",
      status: "published",
      createdBy: "test-admin-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    // Return all 10 template stages (not just locked ones)
    prismaMock.pipelineStage.findMany.mockResolvedValue(MOCK_TEMPLATE_STAGES as any);
    prismaMock.pipelineStage.createMany.mockResolvedValue({ count: 10 });
  });

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
      location: "Remote",
      status: "published",
      assignedToUserId: "a0000001-0000-4000-8000-000000000001",
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

  it("POST /api/offers clones all 10 template stages (not just 4 locked)", async () => {
    const offerData = {
      title: "New Role",
      description: "Description",
      location: "Remote",
      status: "draft",
      assignedToUserId: "a0000001-0000-4000-8000-000000000001",
    };

    const req = new NextRequest("http://localhost/api/offers", {
      method: "POST",
      body: JSON.stringify(offerData),
    });

    await POST(req);

    expect(prismaMock.pipelineStage.createMany).toHaveBeenCalledOnce();
    const callArgs = prismaMock.pipelineStage.createMany.mock.calls[0][0];
    expect(callArgs.data).toHaveLength(10);
    // 4 locked stages preserved
    expect(callArgs.data.filter((s: any) => s.isLocked)).toHaveLength(4);
    // 6 intermediate (not locked)
    expect(callArgs.data.filter((s: any) => !s.isLocked)).toHaveLength(6);
    // Positions 1-10 all present
    const positions = callArgs.data.map((s: any) => s.order).sort((a: number, b: number) => a - b);
    expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});
