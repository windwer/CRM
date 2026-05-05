import { db } from "./db";
import { Prisma } from "@antigravity/database";
import logger from "./logger";
import { deleteBlob } from "@/lib/azure/blobService";
import { MAX_GDPR_BATCH } from "@/lib/pagination";

type AnonymizeOptions = {
  userId?: string | null;
  source?: "manual" | "cron";
};

function hasAzureStorageConfig() {
  return Boolean(
    process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCOUNT_KEY
  );
}

/**
 * Schedules a GDPR deletion entry for a candidate.
 * By default, set to 2 years from now.
 */
export async function scheduleGDPRDeletion(candidateId: string) {
  const deletionDate = new Date();
  deletionDate.setFullYear(deletionDate.getFullYear() + 2);

  const entry = await db.gDPRDeletionQueue.create({
    data: {
      candidateId: candidateId,
      deletionDate: deletionDate,
      status: "pending",
    },
  });

  logger.info("GDPR deletion scheduled", { candidateId, deletionDate });
  return entry;
}

/**
 * Immediately anonymizes a candidate's personal data.
 * Irreversible action per GDPR 'right to be forgotten'.
 */
export async function anonymizeCandidate(
  candidateId: string,
  options: AnonymizeOptions = { source: "manual" }
) {
  const candidate = await db.candidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      cvBlobId: true,
      fullName: true,
      anonymizedAt: true,
    },
  });

  if (!candidate) {
    throw new Error(`Candidate ${candidateId} not found`);
  }

  if (candidate.anonymizedAt) {
    return { candidateId, alreadyAnonymized: true };
  }

  if (candidate.cvBlobId) {
    if (hasAzureStorageConfig()) {
      try {
        await deleteBlob(candidate.cvBlobId);
      } catch (error) {
        logger.warn(`Failed to delete blob ${candidate.cvBlobId}`, { error });
      }
    } else {
      logger.warn("Skipping CV blob deletion because Azure Storage is not configured", {
        candidateId,
        blobId: candidate.cvBlobId,
      });
    }
  }

  return await db.$transaction(async (tx) => {
    const anonymizedEmail = `anonymized-${candidateId}@anonymized.local`;

    await tx.communication.updateMany({
      where: {
        application: { candidateId },
      },
      data: {
        subject: null,
        body: null,
      },
    });

    await tx.candidate.update({
      where: { id: candidateId },
      data: {
        email: anonymizedEmail,
        fullName: "ANONYMIZED",
        phone: null,
        linkedinUrl: null,
        cvRawText: null,
        cvBlobId: null,
        parsedData: Prisma.DbNull,
        skillsArray: [],
        anonymizedAt: new Date(),
        archivedAt: new Date(), // Ensure it's archived too
      },
    });

    await tx.gDPRDeletionQueue.updateMany({
      where: { candidateId, status: "pending" },
      data: { status: "anonymized" },
    });

    await tx.auditLog.create({
      data: {
        action: "gdpr_anonymize",
        entityType: "candidate",
        entityId: candidateId,
        userId: options.userId ?? null,
        source: options.source ?? "manual",
        details: { fullNameBefore: candidate.fullName },
      },
    });

    logger.warn("Candidate data anonymized", {
      candidateId,
      source: options.source ?? "manual",
    });

    return { candidateId, alreadyAnonymized: false };
  });
}

export async function runGDPRCleanup() {
  const now = new Date();
  const batch = await db.gDPRDeletionQueue.findMany({
    where: {
      status: "pending",
      deletionDate: { lte: now },
    },
    take: MAX_GDPR_BATCH,
    orderBy: { deletionDate: "asc" },
  });

  const results = {
    processed: 0,
    skipped: 0,
    errors: [] as Array<{ candidateId: string; message: string }>,
  };

  for (const entry of batch) {
    try {
      const result = await anonymizeCandidate(entry.candidateId, {
        userId: null,
        source: "cron",
      });

      if (result.alreadyAnonymized) {
        results.skipped++;
      } else {
        results.processed++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.errors.push({
        candidateId: entry.candidateId,
        message,
      });
      logger.error(`GDPR cleanup failed for ${entry.candidateId}`, { error });
    }
  }

  logger.info("GDPR cleanup batch finished", results);
  return results;
}
