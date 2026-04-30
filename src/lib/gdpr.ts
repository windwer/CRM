import { db } from "./db";
import { Prisma } from "@antigravity/database";
import logger from "./logger";

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
export async function anonymizeCandidate(candidateId: string) {
  return await db.$transaction(async (tx) => {
    const anonymizedEmail = `anonymized-${candidateId}@anonymized.local`;

    const updated = await tx.candidate.update({
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
      where: { candidateId: candidateId },
      data: { status: "anonymized" },
    });

    logger.warn("Candidate data anonymized", { candidateId });
    return updated;
  });
}
