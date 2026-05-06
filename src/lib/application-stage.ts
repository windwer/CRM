import { db } from "@/lib/db";

type ChangeStageOptions = {
  applicationId: string;
  newStageId: string;
  changedById?: string | null;
  recordHistory?: boolean;
};

export async function changeApplicationStage({
  applicationId,
  newStageId,
  changedById,
  recordHistory = true,
}: ChangeStageOptions) {
  return await db.$transaction(async (tx) => {
    const app = await tx.application.findUnique({
      where: { id: applicationId },
      select: { id: true, pipelineStageId: true },
    });
    if (!app) throw new Error(`Application ${applicationId} not found`);

    const stage = await tx.pipelineStage.findUnique({
      where: { id: newStageId },
      select: { id: true, isActive: true },
    });
    if (!stage || !stage.isActive) {
      throw new Error(`Pipeline stage ${newStageId} not found or inactive`);
    }

    if (app.pipelineStageId === newStageId) {
      return { applicationId, changed: false };
    }

    const updated = await tx.application.update({
      where: { id: applicationId },
      data: {
        pipelineStageId: newStageId,
        lastContactAt: new Date(),
        lastContactedBy: changedById ?? undefined,
      },
    });

    if (recordHistory) {
      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          previousStageId: app.pipelineStageId ?? null,
          newStageId,
          changedById: changedById ?? null,
        },
      });
    }

    return { applicationId, changed: true, application: updated };
  });
}
