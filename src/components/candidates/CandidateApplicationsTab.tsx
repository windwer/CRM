"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Briefcase, ExternalLink } from "lucide-react";
import { useApplications } from "@/hooks/useApplications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type CandidateApplication = {
  id: string;
  pipelineStage?: { name: string; slug: string; color: string | null } | null;
  aiScore: string | number | null;
  appliedAt: string;
  createdAt: string;
  offer?: {
    title?: string | null;
  } | null;
};

function getStageClass(slug?: string | null) {
  switch (slug) {
    case "hired":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
    case "rejected":
      return "border-rose-500/30 bg-rose-500/10 text-rose-700";
    case "sent_to_client":
    case "interview_client":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-700";
    case "interview_internal":
    case "sent_to_review":
    case "sent_to_review_client":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700";
    case "awaiting_response":
      return "border-sky-500/30 bg-sky-500/10 text-sky-700";
    default:
      return "border-muted-foreground/20 bg-muted text-muted-foreground";
  }
}

function getScoreClass(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score >= 0.8) return "text-emerald-700";
  if (score >= 0.6) return "text-amber-700";
  return "text-rose-700";
}

export function CandidateApplicationsTab({ candidateId }: { candidateId: string }) {
  const t = useTranslations("applications");
  const candidateT = useTranslations("candidates.detail");
  const commonT = useTranslations("common");
  const { applications, isLoading } = useApplications({ candidate_id: candidateId });
  const rows = (applications ?? []) as CandidateApplication[];

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-xl border bg-background/50 p-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex gap-4 items-center">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed bg-muted/10 p-16 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
          <Briefcase className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <h3 className="text-base font-bold text-foreground">
          {candidateT("noApplications")}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
          {candidateT("noApplicationsHint") || "Este candidato aún no se ha postulado a ninguna oferta activa."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="font-bold py-4">{t("table.offer")}</TableHead>
            <TableHead className="font-bold py-4">{t("table.status")}</TableHead>
            <TableHead className="font-bold py-4">{t("table.aiScore")}</TableHead>
            <TableHead className="font-bold py-4">{t("table.appliedAt") || "Applied at"}</TableHead>
            <TableHead className="text-right font-bold py-4">{commonT("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((application) => {
            const numericScore =
              application.aiScore === null || application.aiScore === undefined
                ? null
                : Number(application.aiScore);

            return (
              <TableRow key={application.id} className="group hover:bg-muted/10 transition-colors">
                <TableCell className="font-semibold py-4">
                  {application.offer?.title ?? commonT("unnamed")}
                </TableCell>
                <TableCell className="py-4">
                  <Badge
                    variant="outline"
                    className={cn("capitalize px-3 py-1 font-medium", getStageClass(application.pipelineStage?.slug))}
                  >
                    {application.pipelineStage?.name ?? "—"}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  {numericScore !== null ? (
                    <div className="flex items-center gap-2">
                      <div className={cn("text-sm font-black", getScoreClass(numericScore))}>
                        {Math.round(numericScore * 100)}%
                      </div>
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={cn("h-full rounded-full transition-all",
                            numericScore >= 0.8 ? "bg-emerald-500" :
                            numericScore >= 0.6 ? "bg-amber-500" : "bg-rose-500"
                          )}
                          style={{ width: `${numericScore * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm py-4">
                  {format(
                    new Date(application.appliedAt ?? application.createdAt),
                    "PPP",
                    { locale: es }
                  )}
                </TableCell>
                <TableCell className="text-right py-4">
                  <Button asChild variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/dashboard/applications/${application.id}`}>
                      {commonT("view")}
                      <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
