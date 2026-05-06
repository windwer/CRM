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

/**
 * Crea una oferta de test. Si overrides no incluye createdBy, crea un usuario temporal.
 */
export async function createTestOffer(overrides: Record<string, unknown> = {}) {
  const createdBy =
    (overrides.createdBy as string | undefined) ?? (await createTestUser()).id;
  return testDb.offer.create({
    data: {
      title: `Test Offer ${randomUUID().slice(0, 8)}`,
      description: "Test description min 10 chars",
      department: "Engineering",
      location: "Remote",
      status: "published",
      ...(overrides as any),
      createdBy,
    },
  });
}

/**
 * Crea una application de test. Si overrides no incluye candidateId/offerId, los crea automáticamente.
 */
export async function createTestApplication(overrides: Record<string, unknown> = {}) {
  const candidateId =
    (overrides.candidateId as string | undefined) ?? (await createTestCandidate()).id;
  const offerId =
    (overrides.offerId as string | undefined) ?? (await createTestOffer()).id;
  const pendingStage = await testDb.pipelineStage.findFirst({
    where: { slug: "pending" },
  });
  if (!pendingStage)
    throw new Error("Stage 'pending' no existe en DB de test. Ejecuta: pnpm test:setup");

  return testDb.application.create({
    data: {
      pipelineStageId: pendingStage.id,
      ...(overrides as any),
      candidateId,
      offerId,
    },
  });
}

// === Helpers de stages ===

export async function getStage(slug: string) {
  const stage = await testDb.pipelineStage.findUnique({ where: { slug } });
  if (!stage)
    throw new Error(
      `Stage '${slug}' no encontrado en DB de test. Ejecuta: pnpm test:setup`
    );
  return stage;
}

// === Crear N candidatos ===

export async function createTestCandidates(
  count: number,
  overrides: Record<string, unknown> = {}
) {
  return Promise.all(
    Array.from({ length: count }, () =>
      createTestCandidate({
        ...overrides,
        email: `candidate-${randomUUID()}@test.local`,
      })
    )
  );
}

// === Crear oferta + N applications en stages variados ===

export async function createOfferWithApplications(
  options: {
    applicationCount?: number;
    stageDistribution?: Record<string, number>;
    offerOverrides?: Record<string, unknown>;
  } = {}
) {
  const offer = await createTestOffer(options.offerOverrides);
  const applications: any[] = [];

  if (options.stageDistribution) {
    for (const [slug, count] of Object.entries(options.stageDistribution)) {
      const stage = await getStage(slug);
      for (let i = 0; i < count; i++) {
        const candidate = await createTestCandidate();
        const app = await testDb.application.create({
          data: {
            candidateId: candidate.id,
            offerId: offer.id,
            pipelineStageId: stage.id,
          },
        });
        applications.push(app);
      }
    }
  } else if (options.applicationCount) {
    const pendingStage = await getStage("pending");
    for (let i = 0; i < options.applicationCount; i++) {
      const candidate = await createTestCandidate();
      const app = await testDb.application.create({
        data: {
          candidateId: candidate.id,
          offerId: offer.id,
          pipelineStageId: pendingStage.id,
        },
      });
      applications.push(app);
    }
  }

  return { offer, applications };
}

// === Entrada en GDPRDeletionQueue ===

export async function createGDPRQueueEntry(candidateId: string, vencida = true) {
  return testDb.gDPRDeletionQueue.create({
    data: {
      candidateId,
      deletionDate: vencida
        ? new Date(Date.now() - 1000)
        : new Date(Date.now() + 86_400_000 * 365),
      status: "pending",
    },
  });
}
