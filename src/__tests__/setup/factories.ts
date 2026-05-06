import { testDb } from "./prisma-test-db";
import { randomUUID } from "crypto";

export async function createTestUser(overrides: Record<string, unknown> = {}) {
  return testDb.user.create({
    data: {
      id: randomUUID(),
      email: `user-${randomUUID()}@test.local`,
      name: "Test User",
      role: "recruiter",
      isActive: true,
      ...overrides,
    },
  });
}

export async function createTestCandidate(overrides: Record<string, unknown> = {}) {
  return testDb.candidate.create({
    data: {
      email: `candidate-${randomUUID()}@test.local`,
      fullName: "Test Candidate",
      consentPersonalData: true,
      consentDate: new Date(),
      skillsArray: [],
      ...overrides,
    },
  });
}

export async function createTestOffer(
  createdById: string,
  overrides: Record<string, unknown> = {}
) {
  return testDb.offer.create({
    data: {
      title: `Test Offer ${randomUUID().slice(0, 8)}`,
      description: "Test description min 10 chars",
      department: "Engineering",
      location: "Remote",
      status: "published",
      createdBy: createdById,
      ...overrides,
    },
  });
}

export async function createTestApplication(
  candidateId: string,
  offerId: string,
  overrides: Record<string, unknown> = {}
) {
  const pendingStage = await testDb.pipelineStage.findFirst({
    where: { slug: "pending" },
  });
  if (!pendingStage) throw new Error("Stage 'pending' no existe en DB de test. Ejecuta: pnpm test:setup");

  return testDb.application.create({
    data: {
      candidateId,
      offerId,
      pipelineStageId: pendingStage.id,
      ...overrides,
    },
  });
}
