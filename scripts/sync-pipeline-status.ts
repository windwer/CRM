import { prisma } from "@antigravity/database";
import type { ApplicationStatus } from "@antigravity/database";

const STATUS_MAP: Record<string, ApplicationStatus> = {
  pending: "prospect",
  awaiting_response: "applied",
  interview_internal: "interview_1",
  sent_to_review: "screening",
  sent_to_client: "screening",
  sent_to_review_client: "screening",
  interview_client: "interview_2",
  hired: "hired",
  rejected: "rejected",
};

async function main() {
  const appsToSync = await prisma.application.findMany({
    include: { pipelineStage: true },
  });

  let synced = 0;

  for (const app of appsToSync) {
    if (!app.pipelineStage) continue;

    const correctStatus = STATUS_MAP[app.pipelineStage.slug];
    if (correctStatus && app.status !== correctStatus) {
      await prisma.application.update({
        where: { id: app.id },
        data: { status: correctStatus },
      });
      synced++;
    }
  }

  console.log(`Sincronizadas ${synced} applications`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
