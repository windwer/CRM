import { prisma } from "@smartcrm/database";
import { getBlob, uploadBlob } from "../src/lib/azure/blobService";
import { runGDPRCleanup } from "../src/lib/gdpr";

const hasAzureConfig =
  Boolean(process.env.AZURE_STORAGE_ACCOUNT_NAME) &&
  Boolean(process.env.AZURE_STORAGE_ACCOUNT_KEY);

async function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const created = {
    offerId: undefined as string | undefined,
    candidateId: undefined as string | undefined,
    applicationId: undefined as string | undefined,
    communicationId: undefined as string | undefined,
  };

  try {
    const admin = await prisma.user.findFirst({
      where: { role: "admin", isActive: true },
    });
    if (!admin) {
      throw new Error("No active admin user found. Run the database seed first.");
    }

    const defaultStage = await prisma.pipelineStage.findFirst({
      where: { slug: "pending", isActive: true },
    });
    if (!defaultStage) throw new Error("Pipeline stage 'pending' not found. Run seed first.");

    const suffix = `${Date.now()}`;
    const blobId = hasAzureConfig
      ? await uploadBlob(
          Buffer.from("%PDF-1.4\n% SmartCRM GDPR test PDF\n%%EOF"),
          `gdpr-test-${suffix}.pdf`
        )
      : `gdpr-test-${suffix}.pdf`;

    if (!hasAzureConfig) {
      console.warn(
        "Azure storage credentials are not configured. Using a fake cvBlobId; deleteBlob error handling will be exercised."
      );
    }

    const offer = await prisma.offer.create({
      data: {
        title: `GDPR Test Offer ${suffix}`,
        description: "Temporary offer for GDPR cleanup verification.",
        location: "Remote",
        status: "published",
        createdBy: admin.id,
      },
    });
    created.offerId = offer.id;

    const candidate = await prisma.candidate.create({
      data: {
        fullName: `GDPR Test Candidate ${suffix}`,
        email: `gdpr-test-${suffix}@example.com`,
        consentPersonalData: true,
        consentDate: new Date(),
        skillsArray: ["gdpr-test"],
        cvBlobId: blobId,
      },
    });
    created.candidateId = candidate.id;

    const application = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        offerId: offer.id,
        pipelineStageId: defaultStage.id,
      },
    });
    created.applicationId = application.id;

    const communication = await prisma.communication.create({
      data: {
        applicationId: application.id,
        type: "email",
        subject: "PII subject should be removed",
        body: "PII body should be removed",
        sentBy: admin.id,
        emailFrom: "recruiter@example.com",
        emailTo: candidate.email,
        isOutbound: true,
      },
    });
    created.communicationId = communication.id;

    await prisma.gDPRDeletionQueue.create({
      data: {
        candidateId: candidate.id,
        deletionDate: new Date(),
        status: "pending",
        reason: "US-092 local test",
      },
    });

    const result = await runGDPRCleanup();
    await assert(result.processed >= 1, "GDPR cleanup did not process the test candidate.");

    const updatedCandidate = await prisma.candidate.findUniqueOrThrow({
      where: { id: candidate.id },
    });
    await assert(updatedCandidate.fullName === "ANONYMIZED", "Candidate fullName was not anonymized.");
    await assert(updatedCandidate.email === `anonymized-${candidate.id}@anonymized.local`, "Candidate email was not anonymized.");
    await assert(updatedCandidate.cvBlobId === null, "Candidate cvBlobId was not cleared.");
    await assert(updatedCandidate.anonymizedAt, "Candidate anonymizedAt was not set.");

    const updatedComm = await prisma.communication.findFirstOrThrow({
      where: { applicationId: application.id },
    });
    await assert(updatedComm.subject === null, "Communication subject was not cleared.");
    await assert(updatedComm.body === null, "Communication body was not cleared.");

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: "gdpr_anonymize",
        entityId: candidate.id,
        source: "cron",
      },
    });
    await assert(auditLog, "GDPR audit log was not created.");

    const secondResult = await runGDPRCleanup();
    await assert(secondResult.processed === 0, "Second GDPR cleanup should not process the same candidate.");

    if (hasAzureConfig) {
      let blobDeleted = false;
      try {
        await getBlob(blobId);
      } catch {
        blobDeleted = true;
      }
      await assert(blobDeleted, "Azure blob still exists after GDPR cleanup.");
    }

    console.log("US-092 GDPR cleanup local test passed", {
      candidateId: candidate.id,
      cleanup: result,
      secondCleanup: secondResult,
      azureBlobVerified: hasAzureConfig,
    });
  } finally {
    // Limpia los fixtures creados incluso si la prueba fallo
    console.log("Limpiando fixtures del test GDPR...");

    if (created.communicationId) {
      await prisma.communication.deleteMany({ where: { id: created.communicationId } });
    }
    if (created.applicationId) {
      await prisma.application.deleteMany({ where: { id: created.applicationId } });
    }
    if (created.candidateId) {
      await prisma.gDPRDeletionQueue.deleteMany({ where: { candidateId: created.candidateId } });
      await prisma.auditLog.deleteMany({
        where: { entityId: created.candidateId, entityType: "candidate" },
      });
      await prisma.candidate.deleteMany({ where: { id: created.candidateId } });
    }
    if (created.offerId) {
      await prisma.offer.deleteMany({ where: { id: created.offerId } });
    }

    console.log("Fixtures del test GDPR limpiados.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
