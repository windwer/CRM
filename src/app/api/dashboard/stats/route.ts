import { db } from "@/lib/db";
import { apiResponse, handleApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";
import { startOfMonth } from "date-fns";

const interviewStages = new Set(["interview_internal", "interview_client"]);

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const now = new Date();
    const monthStart = startOfMonth(now);

    const [
      activeOffers,
      totalCandidates,
      totalApplications,
      hiredThisMonth,
      avgAIScoreResult,
      pendingGDPR,
      stages,
      applicationStageCounts,
      recentActivity,
      topOffers
    ] = await Promise.all([
      db.offer.count({ where: { status: { in: ["published", "draft", "paused"] } } }),
      db.candidate.count({ where: { archivedAt: null } }),
      db.application.count(),
      db.application.count({
        where: {
          pipelineStage: { slug: "hired" },
          updatedAt: { gte: monthStart }
        }
      }),
      db.application.aggregate({
        _avg: { aiScore: true },
        where: { aiScore: { not: null } }
      }),
      db.gDPRDeletionQueue.count({
        where: {
          status: "pending",
          deletionDate: { lte: now },
        },
      }),
      db.pipelineStage.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, slug: true, name: true, color: true, category: true, order: true },
      }),
      db.application.groupBy({
        by: ["pipelineStageId"],
        _count: { _all: true },
      }),
      db.communication.findMany({
        take: 10,
        orderBy: { sentAt: "desc" },
        include: {
          application: {
            include: {
              candidate: true,
              offer: true
            }
          }
        }
      }),
      db.offer.findMany({
        where: { status: { in: ["published", "draft", "paused"] } },
        take: 5,
        orderBy: {
          applications: { _count: "desc" }
        },
        select: {
          id: true,
          title: true,
          company: true,
          status: true,
          isUrgent: true,
          _count: {
            select: { applications: true }
          },
          applications: {
            select: {
              id: true,
              pipelineStage: { select: { slug: true } }
            }
          }
        }
      })
    ]);

    const countsByStageId = new Map(
      applicationStageCounts.map((entry) => [entry.pipelineStageId, entry._count._all])
    );

    const pipeline = stages.map((stage) => ({
      slug: stage.slug,
      name: stage.name,
      color: stage.color,
      category: stage.category,
      order: stage.order,
      count: countsByStageId.get(stage.id) ?? 0,
    }));

    return apiResponse({
      kpis: {
        total_offers_active: activeOffers,
        total_candidates: totalCandidates,
        total_applications: totalApplications,
        hired_this_month: hiredThisMonth,
        avg_ai_score: avgAIScoreResult._avg.aiScore ? Number(avgAIScoreResult._avg.aiScore) : 0,
        candidates_pending_gdpr: pendingGDPR
      },
      pipeline,
      pendingGDPR,
      recent_activity: recentActivity.map(comm => ({
        type: comm.isOutbound ? "email_sent" : "email_received",
        candidate_name: comm.application.candidate.fullName,
        offer_title: comm.application.offer.title,
        description: comm.subject || "No subject",
        created_at: comm.sentAt
      })),
      top_offers: topOffers.map(offer => ({
        id: offer.id,
        title: offer.title,
        company: offer.company,
        status: offer.status,
        is_urgent: offer.isUrgent,
        total_candidates: offer._count.applications,
        in_interview: offer.applications.filter((application) =>
          application.pipelineStage?.slug
            ? interviewStages.has(application.pipelineStage.slug)
            : false
        ).length,
        hired: offer.applications.filter((application) =>
          application.pipelineStage?.slug === "hired"
        ).length,
      }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}
