import { prisma } from "@antigravity/database";

async function main() {
  console.log("Buscando fixtures residuales del test GDPR...");

  type OrphanRow = { id: string; offer_id: string; candidate_id: string };
  const orphans = (await prisma.$queryRawUnsafe(
    `SELECT id, offer_id, candidate_id FROM applications WHERE pipeline_stage_id IS NULL`
  )) as OrphanRow[];

  if (orphans.length === 0) {
    console.log("No hay huerfanas. Nada que limpiar.");
    return;
  }

  console.log(`Encontradas ${orphans.length} application(s) huerfana(s).`);

  const appIds = orphans.map((o) => o.id);
  const offerIds = orphans.map((o) => o.offer_id);

  const offers = await prisma.offer.findMany({
    where: { id: { in: offerIds } },
    select: { id: true, title: true },
  });

  const nonTestOffers = offers.filter((o) => !o.title.startsWith("GDPR Test Offer"));
  if (nonTestOffers.length > 0) {
    console.error("PARADA: alguna huerfana NO es fixture del test GDPR:");
    console.error(nonTestOffers);
    console.error("Investiga manualmente antes de continuar.");
    process.exit(1);
  }

  const result = await prisma.$transaction(async (tx) => {
    const commsDeleted = await tx.communication.deleteMany({
      where: { applicationId: { in: appIds } },
    });
    const appsDeleted = await tx.application.deleteMany({
      where: { id: { in: appIds } },
    });
    const offersDeleted = await tx.offer.deleteMany({
      where: { id: { in: offerIds } },
    });
    return {
      communications: commsDeleted.count,
      applications: appsDeleted.count,
      offers: offersDeleted.count,
    };
  });

  console.log("Limpieza completada:", result);

  const remainingRows = (await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM applications WHERE pipeline_stage_id IS NULL`
  )) as [{ count: number }];
  const remaining = remainingRows[0].count;

  if (remaining > 0) {
    console.error(`ATENCION: aun quedan ${remaining} huerfanas. Investiga.`);
    process.exit(1);
  }

  console.log("OK: 0 applications con pipelineStageId NULL.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
