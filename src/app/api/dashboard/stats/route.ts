import { db } from "@/lib/db";
import { apiResponse, handleApiError, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { startOfMonth, subDays } from "date-fns";
import type { DashboardStats } from "@/types/dashboard";

const interviewSlugs = new Set(["interview_internal", "interview_client"]);

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireRole("viewer");
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const offerIdParam = searchParams.get("offer_id");

    if (offerIdParam !== null) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(offerIdParam)) {
        throw new ApiError("VALIDATION_ERROR", "offer_id must be a valid UUID", 400);
      }
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const thirtyDaysAgo = subDays(now, 30);

    const applicationWhere = offerIdParam ? { offerId: offerIdParam } : {};

    // All queries in a single Promise.all — max 5 DB round-trips
    const [
      activeOffers,
      totalCandidates,
      applicationsLast30,
      hiredThisMonth,
      avgAIScoreResult,
      pendingGDPR,
      templateStages,
      stageCounts,
      recentActivity,
      topOffers,
    ] = await Promise.all([
      db.offer.count({ where: { status: { in: ["published", "draft", "paused"] } } }),
      db.candidate.count({ where: { archivedAt: null } }),
      db.application.count({ where: { ...applicationWhere, createdAt: { gte: thirtyDaysAgo } } }),
      db.application.count({
        where: {
          ...applicationWhere,
          pipelineStage: { slug: "hired" },
          updatedAt: { gte: monthStart },
        },
      }),
      db.application.aggregate({
        _avg: { aiScore: true },
        where: { ...applicationWhere, aiScore: { not: null } },
      }),
      db.gDPRDeletionQueue.count({
        where: { status: "pending", deletionDate: { lte: now } },
      }),
      // Template stages (offerId IS NULL) for funnel labels
      db.pipelineStage.findMany({
        where: { offerId: null, isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, slug: true, name: true, color: true, category: true, order: true },
      }),
      // Funnel counts: groupBy on offer-scoped or template stages
      offerIdParam
        ? db.application.groupBy({
            by: ["pipelineStageId"],
            where: { offerId: offerIdParam },
            _count: { id: true },
          })
        : db.application.groupBy({
            by: ["pipelineStageId"],
            _count: { id: true },
          }),
      db.communication.findMany({
        take: 10,
        orderBy: { sentAt: "desc" },
        include: {
          application: { include: { candidate: true, offer: true } },
        },
      }),
      db.offer.findMany({
        where: { status: { in: ["published", "draft", "paused"] } },
        take: 5,
        orderBy: { applications: { _count: "desc" } },
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          status: true,
          isUrgent: true,
          _count: { select: { applications: true } },
          // Count in-interview and hired directly via relations
          applications: {
            where: {
              pipelineStage: { slug: { in: ["interview_internal", "interview_client", "hired"] } },
            },
            select: { id: true, pipelineStage: { select: { slug: true } } },
          },
        },
      }),
    ]);

    // Build slug→count map from groupBy result
    // For template-based funnel: match by slug across all per-offer stages
    const stageIdToSlug = new Map<string, string>();
    if (!offerIdParam) {
      const allStages = await db.pipelineStage.findMany({
        where: { isActive: true },
        select: { id: true, slug: true },
      });
      for (const s of allStages) stageIdToSlug.set(s.id, s.slug);
    } else {
      const offerStages = await db.pipelineStage.findMany({
        where: { offerId: offerIdParam, isActive: true },
        select: { id: true, slug: true },
      });
      for (const s of offerStages) stageIdToSlug.set(s.id, s.slug);
    }

    const slugCounts = new Map<string, number>();
    for (const entry of stageCounts) {
      const slug = stageIdToSlug.get(entry.pipelineStageId ?? "");
      if (slug) {
        slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + (entry._count as any).id);
      }
    }

    const pipeline = templateStages.map((stage) => ({
      slug: stage.slug,
      name: stage.name,
      color: stage.color ?? "#6b7280",
      category: stage.category as "todo" | "in_progress" | "done",
      order: stage.order,
      count: slugCounts.get(stage.slug) ?? 0,
    }));

    const stats: DashboardStats = {
      kpis: {
        total_offers_active: activeOffers,
        total_candidates: totalCandidates,
        total_applications: applicationsLast30,
        hired_this_month: hiredThisMonth,
        avg_ai_score: avgAIScoreResult._avg.aiScore ? Number(avgAIScoreResult._avg.aiScore) : 0,
        candidates_pending_gdpr: pendingGDPR,
      },
      pendingGDPR,
      pipeline,
      recent_activity: recentActivity.map((comm) => ({
        type: (comm.isOutbound ? "email_sent" : "email_received") as "email_sent" | "email_received",
        candidate_name: comm.application.candidate.fullName,
        offer_title: comm.application.offer.title,
        description: comm.subject || "Sin asunto",
        created_at: comm.sentAt,
      })),
      top_offers: topOffers.map((offer) => ({
        id: offer.id,
        title: offer.title,
        company: offer.company ?? null,
        location: offer.location ?? null,
        status: offer.status,
        is_urgent: offer.isUrgent ?? false,
        total_candidates: offer._count.applications,
        in_interview: offer.applications.filter((a) =>
          interviewSlugs.has(a.pipelineStage?.slug ?? "")
        ).length,
        hired: offer.applications.filter((a) => a.pipelineStage?.slug === "hired").length,
      })),
    };

    const res = NextResponse.json({ success: true, data: stats });
    res.headers.set("Cache-Control", "private, max-age=300, stale-while-revalidate=60");
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}
