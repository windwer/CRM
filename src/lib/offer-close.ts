import type { Prisma } from "@smartcrm/database";

type PrismaTransactionClient = Prisma.TransactionClient;

export async function closeOffer(params: {
  offerId: string;
  status: "closed_hired" | "closed_no_hire";
  hiredApplicationId?: string;
  closedById: string;
  oldStatus: string;
  tx: PrismaTransactionClient;
}) {
  const { offerId, status, hiredApplicationId, closedById, oldStatus, tx } = params;
  const now = new Date();

  const pendingStage = await tx.pipelineStage.findFirst({
    where: { slug: "pending", isActive: true, offerId: null },
  });
  const hiredStage = await tx.pipelineStage.findFirst({
    where: { slug: "hired", isActive: true, offerId: null },
  });
  const doneStages = await tx.pipelineStage.findMany({
    where: { category: "done", isActive: true },
  });
  const doneStageIds = doneStages.map((stage) => stage.id);
  const applications = await tx.application.findMany({ where: { offerId } });

  if (status === "closed_hired") {
    if (!hiredApplicationId) throw new Error("HIRED_APPLICATION_REQUIRED");

    const hiredApplication = applications.find((application) => application.id === hiredApplicationId);
    if (!hiredApplication) throw new Error("HIRED_APPLICATION_NOT_IN_OFFER");

    await tx.application.update({
      where: { id: hiredApplicationId },
      data: {
        pipelineStageId: hiredStage?.id,
        lastContactAt: now,
      },
    });

    const otherApplicationIds = applications
      .filter(
        (application) =>
          application.id !== hiredApplicationId &&
          !doneStageIds.includes(application.pipelineStageId ?? "")
      )
      .map((application) => application.id);

    if (otherApplicationIds.length > 0) {
      await tx.application.updateMany({
        where: { id: { in: otherApplicationIds } },
        data: { pipelineStageId: pendingStage?.id },
      });
    }

    await tx.offer.update({
      where: { id: offerId },
      data: {
        status: "closed_hired",
        closedAt: now,
        closedById,
        hiredApplicationId: hiredApplicationId,
      },
    });
  } else {
    const toMoveIds = applications
      .filter((application) => !doneStageIds.includes(application.pipelineStageId ?? ""))
      .map((application) => application.id);

    if (toMoveIds.length > 0) {
      await tx.application.updateMany({
        where: { id: { in: toMoveIds } },
        data: { pipelineStageId: pendingStage?.id },
      });
    }

    await tx.offer.update({
      where: { id: offerId },
      data: {
        status: "closed_no_hire",
        closedAt: now,
        closedById,
        hiredApplicationId: null,
      },
    });
  }

  await tx.offerChange.create({
    data: {
      offerId,
      changedBy: closedById,
      fieldName: "status",
      oldValue: oldStatus,
      newValue: status,
      changedAt: now,
    },
  });
}

export async function reopenOffer(params: {
  offerId: string;
  reopenedById: string;
  tx: PrismaTransactionClient;
}) {
  const { offerId, reopenedById, tx } = params;
  const offer = await tx.offer.findUnique({ where: { id: offerId } });

  if (!offer) throw new Error("OFFER_NOT_FOUND");
  if (offer.status !== "closed_no_hire") {
    throw new Error("OFFER_CANNOT_BE_REOPENED");
  }

  await tx.offer.update({
    where: { id: offerId },
    data: {
      status: "published",
      reopenedAt: new Date(),
      reopenedById,
      closedAt: null,
    },
  });

  await tx.offerChange.create({
    data: {
      offerId,
      changedBy: reopenedById,
      fieldName: "status",
      oldValue: "closed_no_hire",
      newValue: "published",
      changedAt: new Date(),
    },
  });
}
