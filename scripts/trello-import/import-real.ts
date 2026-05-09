import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CandidateSource,
  JobType,
  OfferStatus,
  StageCategory,
  prisma,
} from "@smartcrm/database";
import { closeOffer } from "../../src/lib/offer-close";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

const OFFERS = [
  {
    key: "veolia_jp_infra",
    title: "Jefe de Proyecto de Infraestructura",
    company: "Veolia",
    positionType: "manager",
    status: OfferStatus.published,
    isUrgent: false,
    customTags: ["JP", "infraestructura", "PMP", "Barcelona"],
    mustHaves: [
      "Experiencia minima 5 anos como Jefe de Proyecto de Infraestructura IT",
      "Certificacion PMP o equivalente valorada",
      "Experiencia en telecomunicaciones",
      "Disponibilidad en Barcelona",
    ].join("\n"),
    description:
      "Busqueda de Jefe de Proyecto de Infraestructura para Veolia. Importado desde Trello (label: JP Infra).",
  },
  {
    key: "veolia_tecnico_it",
    title: "Tecnico IT",
    company: "Veolia",
    positionType: "developer",
    status: OfferStatus.published,
    isUrgent: false,
    customTags: ["IT", "soporte", "infraestructura", "Barcelona"],
    mustHaves: [
      "Experiencia en soporte tecnico y administracion de sistemas",
      "Conocimiento de Active Directory y entornos Microsoft",
      "Valorable certificacion AWS o Cloud",
      "Disponibilidad presencial",
    ].join("\n"),
    description:
      "Busqueda de Tecnico IT para Veolia. Importado desde Trello (label: Tecnico IT).",
  },
  {
    key: "cellnex_pm",
    title: "Project Manager",
    company: "Cellnex",
    positionType: "manager",
    status: OfferStatus.published,
    isUrgent: false,
    customTags: ["PM", "PMO", "telecomunicaciones", "matricial"],
    mustHaves: [
      "Experiencia minima 5 anos como Project Manager IT",
      "PMP Internacional o certificacion equivalente",
      "Experiencia en entornos matriciales",
      "Ingles avanzado",
    ].join("\n"),
    description:
      "Busqueda de Project Manager para Cellnex. Importado desde Trello. POSICION CUBIERTA: Inaki Santillana Garay.",
  },
] as const;

const CANDIDATES = [
  { offerKey: "veolia_jp_infra", stage: "sent_to_client", fullName: "Tomas Santili Jimenez", email: "tomas.santili.jimenez@import.local", phone: null, linkedinUrl: null, skillsArray: ["Gestion de proyectos", "Infraestructura cloud", "Platform Engineering"], source: "manual", candidateNotes: "55k. Candidato con solida experiencia en gestion de proyectos de infraestructura cloud." },
  { offerKey: "veolia_jp_infra", stage: "sent_to_review", fullName: "Carlos Fonseca Angulo", email: "carlos.fonseca.angulo@import.local", phone: null, linkedinUrl: null, skillsArray: ["Gestion de proyectos", "Telecomunicaciones", "PMP", "Scrum Master", "ITIL"], source: "manual", candidateNotes: "50-55k. Ingeniero Industrial, PMP, Scrum Master, ITIL. 8 anos en proyectos, 5 en telecomunicaciones. Perfil muy solido." },
  { offerKey: "veolia_jp_infra", stage: "interview_internal", fullName: "Karim Soboh El Khaldi", email: "karim.soboh.el.khaldi@import.local", phone: null, linkedinUrl: null, skillsArray: ["Infraestructura IT", "Gestion de proyectos"], source: "manual", candidateNotes: "55k. No da datos por telefono. Pendiente de agendar slots para siguiente semana." },
  { offerKey: "veolia_jp_infra", stage: "awaiting_response", fullName: "Alejandro Alonso Arenas", email: "aalonsoas@gmail.com", phone: null, linkedinUrl: null, skillsArray: ["Gestion de proyectos", "Infraestructura IT", "Barcelona"], source: "linkedin", candidateNotes: "50k. Barcelona. Score 46/100. Descarte por PM de aplicacion. A la espera de respuesta." },
  { offerKey: "veolia_jp_infra", stage: "awaiting_response", fullName: "Carlos Fonseca", email: "lngfonsek@gmail.com", phone: null, linkedinUrl: null, skillsArray: ["Gestion de proyectos", "Infraestructura", "Barcelona"], source: "linkedin", candidateNotes: "Barcelona. EU Citizen. Score 82/100. Fortalezas destacadas. A la espera de respuesta." },
  { offerKey: "veolia_jp_infra", stage: "awaiting_response", fullName: "Ramon Garcia Lozano", email: "rgarloz@gmail.com", phone: null, linkedinUrl: null, skillsArray: ["Infraestructura IT", "Gestion de proyectos"], source: "linkedin", candidateNotes: "45k parece tope. Barcelona. 57 anos. Score 48/100." },
  { offerKey: "veolia_jp_infra", stage: "awaiting_response", fullName: "Salvatore Lorenzo", email: "salvatore.lorenzo@import.local", phone: null, linkedinUrl: null, skillsArray: ["Consultor Senior IT", "Arquitectura IT", "Infraestructura"], source: "manual", candidateNotes: "50k. Buen stack tecnologico. Experiencia senior 30+ anos. Fortalezas destacadas." },
  { offerKey: "veolia_jp_infra", stage: "awaiting_response", fullName: "Jesus Alexis", email: "jesus.alexis@import.local", phone: null, linkedinUrl: null, skillsArray: ["Infraestructura IT"], source: "manual", candidateNotes: "45k. CV muy resumido con poca informacion. Gaps criticos detectados." },
  { offerKey: "veolia_jp_infra", stage: "rejected", fullName: "Emilio Elena Bahillo", email: "emilio.elena.bahillo@import.local", phone: null, linkedinUrl: null, skillsArray: ["Infraestructura IT"], source: "manual", candidateNotes: "Descartado." },
  { offerKey: "veolia_jp_infra", stage: "rejected", fullName: "Roberto Hernandez Lopez", email: "roberto.hernandez.lopez@import.local", phone: null, linkedinUrl: null, skillsArray: ["Infraestructura IT"], source: "manual", candidateNotes: "40k. Descartado." },
  { offerKey: "veolia_jp_infra", stage: "rejected", fullName: "Maria Fernanda Casique Barrios", email: "maria.fernanda.casique.barrios@import.local", phone: null, linkedinUrl: null, skillsArray: ["Infraestructura IT"], source: "manual", candidateNotes: "48k. Descartada." },
  { offerKey: "veolia_jp_infra", stage: "rejected", fullName: "Joan Gual", email: "joan.gual@import.local", phone: null, linkedinUrl: null, skillsArray: ["PM", "Transformacion organizacional"], source: "manual", candidateNotes: "Busca roles de PM puro o transformacion organizacional. No encaja con el perfil. Descartado." },
  { offerKey: "veolia_jp_infra", stage: "rejected", fullName: "Jimena Lagrotta", email: "jimena.lagrotta@import.local", phone: null, linkedinUrl: null, skillsArray: ["PM", "Infraestructura"], source: "manual", candidateNotes: "55k. Descartada." },
  { offerKey: "veolia_jp_infra", stage: "rejected", fullName: "Bruno Boutfroy", email: "bruno.boutfroy@import.local", phone: null, linkedinUrl: null, skillsArray: ["PM", "Infraestructura IT"], source: "manual", candidateNotes: "60k. Descartado." },
  { offerKey: "veolia_tecnico_it", stage: "sent_to_client", fullName: "Tomas Villalobos Hernandez", email: "tomas.villalobos.hernandez@import.local", phone: "722126945", linkedinUrl: null, skillsArray: ["Soporte IT", "Infraestructura cloud"], source: "manual", candidateNotes: "De Costa Rica. Validando papeles, tiene permiso de estudios. Enviado a cliente." },
  { offerKey: "veolia_tecnico_it", stage: "interview_internal", fullName: "Carolina Murillo", email: "carolina.murillo@import.local", phone: null, linkedinUrl: null, skillsArray: ["Soporte IT", "Infraestructura", "Tecnico IT"], source: "manual", candidateNotes: "Information Technology Technician. Amplia experiencia. Perfil ajustado al puesto." },
  { offerKey: "veolia_tecnico_it", stage: "interview_internal", fullName: "Daniel Ddungu", email: "daniel.ddungu@import.local", phone: null, linkedinUrl: null, skillsArray: ["AWS Certified Cloud Practitioner", "Infraestructura cloud", "Soporte IT"], source: "manual", candidateNotes: "Perfil mas ajustado al puesto. AWS Certified Cloud Practitioner. Puntos a favor destacados." },
  { offerKey: "veolia_tecnico_it", stage: "pending", fullName: "Carmen Perez", email: "carmen.perez@import.local", phone: null, linkedinUrl: null, skillsArray: ["Soporte IT", "Desarrollo", "Infraestructura IT"], source: "manual", candidateNotes: "Perfil tecnico IT + desarrollo. Reciclada despues de paron en carrera. Muy actualizada." },
  { offerKey: "veolia_tecnico_it", stage: "pending", fullName: "Rowell Vasquez", email: "rowell.vasquez@import.local", phone: null, linkedinUrl: null, skillsArray: ["Tecnico IT"], source: "manual", candidateNotes: "Pendiente de revision." },
  { offerKey: "veolia_tecnico_it", stage: "pending", fullName: "Sonny Erice Hernandez", email: "sonny.erice.hernandez@import.local", phone: null, linkedinUrl: null, skillsArray: ["Tecnico IT"], source: "manual", candidateNotes: "No esta en Madrid. Pendiente de valorar disponibilidad." },
  { offerKey: "veolia_tecnico_it", stage: "rejected", fullName: "John Montoya Payares", email: "john.montoya.payares@import.local", phone: null, linkedinUrl: null, skillsArray: ["Soporte IT"], source: "manual", candidateNotes: "A validar. Gaps criticos: sin mencion a AWS/Cloud ni Active Directory." },
  { offerKey: "veolia_tecnico_it", stage: "rejected", fullName: "Ignacio Pardinas", email: "ignacio.pardinas@import.local", phone: null, linkedinUrl: null, skillsArray: ["AWS", "Soporte IT"], source: "manual", candidateNotes: "AWS por su cuenta. Descartado." },
  { offerKey: "veolia_tecnico_it", stage: "rejected", fullName: "Eloy Antonio Gonzalez Vitale", email: "eloy.antonio.gonzalez.vitale@import.local", phone: null, linkedinUrl: null, skillsArray: ["Soporte IT"], source: "manual", candidateNotes: "Muy proactivo y con muchas ganas. Entrevista realizada. Descartado." },
  { offerKey: "veolia_tecnico_it", stage: "rejected", fullName: "Miguel Angel Rodero Ballester", email: "miguel.angel.rodero.ballester@import.local", phone: null, linkedinUrl: null, skillsArray: ["Infraestructura IT", "Redes"], source: "manual", candidateNotes: "Perfil senior/muy senior. Posible sobrecualificacion. Descartado." },
  { offerKey: "cellnex_pm", stage: "hired", fullName: "Inaki Santillana Garay", email: "inaki.santillana.garay@import.local", phone: null, linkedinUrl: null, skillsArray: ["PM", "PMO", "PMP Internacional", "Gestion matricial", "Telecomunicaciones"], source: "manual", candidateNotes: "48k. Senior con matiz de antiguedad a gestionar. Experiencia PM 25+ anos. Getronics, PMP Internacional / matricial. CONTRATADO." },
  { offerKey: "cellnex_pm", stage: "interview_client", fullName: "Francisco Vargas", email: "francisco.vargas@import.local", phone: "637968999", linkedinUrl: null, skillsArray: ["PM", "Service Delivery Manager", "Gestion de cuentas cliente"], source: "manual", candidateNotes: "55k. Trabaja como Service Delivery Manager en cliente final. Lleva cuentas de cliente." },
  { offerKey: "cellnex_pm", stage: "rejected", fullName: "Rebeca Paras", email: "rebeca.paras@import.local", phone: null, linkedinUrl: null, skillsArray: ["PM", "Agile Coach"], source: "manual", candidateNotes: "40k. Podria valer para Cellnex pero descartada." },
  { offerKey: "cellnex_pm", stage: "rejected", fullName: "Esteban Bellani", email: "esteban.bellani@import.local", phone: null, linkedinUrl: null, skillsArray: ["PM", "IT", "Networking", "Infraestructura"], source: "manual", candidateNotes: "53k. Conocimiento en infra. Experiencia en proyectos IT y networking. Multicultura. Descartado." },
  { offerKey: "cellnex_pm", stage: "rejected", fullName: "Antonio Lorente", email: "antonio.lorente@import.local", phone: "699879164", linkedinUrl: "https://www.linkedin.com/in/antoniolorenteredondo/", skillsArray: ["PM"], source: "referral", candidateNotes: "Recomendado por Jose Antonio Quesada. Descartado." },
  { offerKey: "cellnex_pm", stage: "rejected", fullName: "Bernat Lopez", email: "bernat.lopez@import.local", phone: null, linkedinUrl: null, skillsArray: ["PM"], source: "manual", candidateNotes: "Descartado." },
  { offerKey: "cellnex_pm", stage: "rejected", fullName: "Gladys Marcano", email: "gladys.marcano@import.local", phone: null, linkedinUrl: null, skillsArray: ["PM", "Cloud", "Telefonia", "Migraciones", "Data center"], source: "manual", candidateNotes: "45k. Experta en telefonia, hostings, implantaciones, migraciones, data center. Descartada." },
  { offerKey: "cellnex_pm", stage: "rejected", fullName: "Victor Cornet", email: "victor.cornet@import.local", phone: null, linkedinUrl: null, skillsArray: ["PM"], source: "manual", candidateNotes: "Descartado." },
  { offerKey: "cellnex_pm", stage: "rejected", fullName: "Jose Maria Gonzalez Chema", email: "jose.maria.gonzalez.chema@import.local", phone: null, linkedinUrl: null, skillsArray: ["PM", "MBA"], source: "manual", candidateNotes: "Descartado." },
  { offerKey: "cellnex_pm", stage: "rejected", fullName: "Samir Fattal", email: "samir.fattal@import.local", phone: null, linkedinUrl: null, skillsArray: ["PM", "Agile Coach"], source: "manual", candidateNotes: "60k en adelante. Descartado." },
] as const;

const REQUIRED_STAGES = [
  "pending",
  "awaiting_response",
  "interview_internal",
  "sent_to_review",
  "sent_to_client",
  "sent_to_review_client",
  "interview_client",
  "hired",
  "rejected",
  "bbdd_smartway",
];

async function clearRecruitingData() {
  await prisma.offer.updateMany({ data: { hiredApplicationId: null } });
  await prisma.communication.deleteMany({});
  await prisma.applicationStatusHistory.deleteMany({});
  await prisma.aIProcessingLog.deleteMany({});
  await prisma.gDPRDeletionQueue.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.offerChange.deleteMany({});
  await prisma.offer.deleteMany({});
}

async function importRealData() {
  console.log("Iniciando importacion...");

  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!admin) throw new Error("Ejecuta pnpm db:seed primero.");

  const stages = await prisma.pipelineStage.findMany({ where: { isActive: true } });
  const stageBySlug = Object.fromEntries(stages.map((stage) => [stage.slug, stage]));
  for (const slug of REQUIRED_STAGES) {
    if (!stageBySlug[slug]) {
      throw new Error(`Stage '${slug}' no encontrado. Ejecuta el seed primero.`);
    }
  }
  if (stages.length !== REQUIRED_STAGES.length) {
    throw new Error(`Se esperaban exactamente ${REQUIRED_STAGES.length} stages activos y hay ${stages.length}. Ejecuta el seed actualizado.`);
  }
  console.log(`Stages OK: ${stages.length} encontrados`);

  await clearRecruitingData();
  console.log("Datos demo de ofertas/candidatos limpiados.");

  const offerMap: Record<string, Awaited<ReturnType<typeof prisma.offer.create>>> = {};
  for (const offer of OFFERS) {
    const created = await prisma.offer.create({
      data: {
        title: offer.title,
        company: offer.company,
        positionType: offer.positionType,
        status: offer.status,
        isUrgent: offer.isUrgent,
        customTags: [...offer.customTags],
        mustHaves: offer.mustHaves,
        description: offer.description,
        jobType: JobType.full_time,
        createdBy: admin.id,
        publishedAt: new Date(),
      },
    });
    offerMap[offer.key] = created;
    console.log(`  Oferta creada: ${offer.title} @ ${offer.company}`);
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const candidateData of CANDIDATES) {
    try {
      const offer = offerMap[candidateData.offerKey];
      const stage = stageBySlug[candidateData.stage];
      const existing = await prisma.candidate.findUnique({ where: { email: candidateData.email } });

      if (existing) {
        const existingApp = await prisma.application.findUnique({
          where: { candidateId_offerId: { candidateId: existing.id, offerId: offer.id } },
        });
        if (existingApp) {
          console.log(`  Omitido (ya existe): ${candidateData.fullName}`);
          skipped++;
          continue;
        }
      }

      const candidate = await prisma.candidate.upsert({
        where: { email: candidateData.email },
        create: {
          fullName: candidateData.fullName,
          email: candidateData.email,
          phone: candidateData.phone,
          linkedinUrl: candidateData.linkedinUrl,
          skillsArray: [...candidateData.skillsArray],
          source: candidateData.source as CandidateSource,
          consentPersonalData: true,
          consentDate: new Date(),
          consentSource: "Importacion Trello",
          importedAt: new Date(),
        },
        update: {
          skillsArray: [...candidateData.skillsArray],
          source: candidateData.source as CandidateSource,
          importedAt: new Date(),
        },
      });

      const existingGdprQueue = await prisma.gDPRDeletionQueue.findFirst({
        where: { candidateId: candidate.id },
      });
      if (!existingGdprQueue) {
        await prisma.gDPRDeletionQueue.create({
          data: {
            candidateId: candidate.id,
            deletionDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
            status: "pending",
            reason: "Importacion Trello",
          },
        });
      }

      await prisma.application.create({
        data: {
          candidateId: candidate.id,
          offerId: offer.id,
          pipelineStageId: stage.id,
          candidateNotes: candidateData.candidateNotes,
          appliedAt: new Date(),
        },
      });

      created++;
      console.log(`  + ${candidateData.fullName} -> [${candidateData.stage}] ${offer.title} @ ${offer.company}`);
    } catch (error) {
      console.error(`  ERROR con ${candidateData.fullName}:`, error);
      errors++;
    }
  }

  const inaki = await prisma.candidate.findUnique({
    where: { email: "inaki.santillana.garay@import.local" },
    include: { applications: { where: { offerId: offerMap.cellnex_pm.id } } },
  });

  if (inaki?.applications[0]) {
    await prisma.$transaction(async (tx) => {
      await closeOffer({
        offerId: offerMap.cellnex_pm.id,
        status: "closed_hired",
        hiredApplicationId: inaki.applications[0].id,
        closedById: admin.id,
        oldStatus: OfferStatus.published,
        tx,
      });
    });

    const franciscoStage = stageBySlug.interview_client;
    await prisma.application.updateMany({
      where: {
        offerId: offerMap.cellnex_pm.id,
        candidate: { email: "francisco.vargas@import.local" },
      },
      data: { pipelineStageId: franciscoStage.id },
    });
    console.log("\n  Oferta Cellnex cerrada: Inaki Santillana Garay CONTRATADO");
  }

  console.log("\n===========================");
  console.log("IMPORTACION COMPLETADA");
  console.log("===========================");
  console.log(`Candidatos creados:  ${created}`);
  console.log(`Candidatos omitidos: ${skipped}`);
  console.log(`Errores:             ${errors}`);

  for (const offer of Object.values(offerMap)) {
    const apps = await prisma.application.findMany({
      where: { offerId: offer.id },
      include: { pipelineStage: true },
    });
    console.log(`\n${offer.title} @ ${offer.company} (${apps.length} candidatos):`);
    const byStage = apps.reduce<Record<string, number>>((acc, application) => {
      const name = application.pipelineStage?.name ?? "Sin stage";
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});
    for (const [stageName, count] of Object.entries(byStage)) {
      console.log(`  ${count} -> ${stageName}`);
    }
  }

  const totals = await prisma.$transaction([
    prisma.offer.count(),
    prisma.offer.count({ where: { status: OfferStatus.published } }),
    prisma.candidate.count({ where: { archivedAt: null } }),
    prisma.application.count(),
    prisma.pipelineStage.count({ where: { isActive: true } }),
  ]);
  console.log(`\nTotales: ${totals[0]} ofertas (${totals[1]} activas), ${totals[2]} candidatos, ${totals[3]} applications, ${totals[4]} stages activos.`);

  if (errors > 0) {
    throw new Error(`Importacion finalizada con ${errors} errores.`);
  }
}

importRealData()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
