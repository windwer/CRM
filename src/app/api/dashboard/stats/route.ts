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

    // Fetch all stats in parallel for efficiency
    const [
      activeOffers,
      totalCandidates,
      totalApplications,
      hiredThisMonth,
      avgAIScoreResult,
      pendingGDPR,
      applicationsWithStage,
      recentActivity,
      topOffers
    ] = await Promise.all([
      db.offer.count({ where: { status: { in: ["published", "draft", "paused"] } } }),
      db.candidate.count({ where: { archivedAt: null } }),
      db.application.count(),
      db.application.count({ 
        where: { 
          status: "hired",
          updatedAt: { gte: monthStart }
        } 
      }),
      db.application.aggregate({
        _avg: { aiScore: true },
        where: { aiScore: { not: null } }
      }),
      db.candidate.count({ where: { consentPersonalData: false, archivedAt: null } }),
      db.application.findMany({
        include: {
          pipelineStage: {
            select: { name: true, slug: true, color: true, order: true }
          }
        }
      }),
      // Recent activity (using communications and status history as proxy)
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
      // Top offers by candidate count
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
              status: true,
              pipelineStage: { select: { slug: true } }
            }
          }
        }
      })
    ]);

    // Format pipeline data
    const pipeline = applicationsWithStage.reduce((acc, application) => {
      const stageName = application.pipelineStage?.slug ?? "pending";
      acc[stageName] = (acc[stageName] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
            : application.status.includes("interview")
        ).length,
        hired: offer.applications.filter((application) => application.status === "hired").length,
      }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}
