"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { Skeleton } from "@/components/ui/skeleton";

type KanbanApp = {
  id: string;
  applied_at: string;
  ai_score: number | null;
  candidate: { id: string; full_name: string; email: string; initials: string };
};

type KanbanStage = {
  id: string;
  name: string;
  position: number;
  color: string;
  is_locked: boolean;
  applications: KanbanApp[];
};

type KanbanData = {
  offer: {
    id: string;
    title: string;
    status: string;
    assignee: { id: string; name: string; initials: string } | null;
  };
  stages: KanbanStage[];
};

function AiScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const pct = Math.round(score * 100);
  const color =
    pct >= 80
      ? "bg-emerald-100 text-emerald-800"
      : pct >= 60
      ? "bg-amber-100 text-amber-800"
      : "bg-rose-100 text-rose-800";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${color}`}>
      IA {pct}%
    </span>
  );
}

export default function OfferKanbanPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const { data, isLoading } = useQuery<{ success: boolean; data: KanbanData }>({
    queryKey: ["kanban", params.id],
    queryFn: () => axios.get(`/api/offers/${params.id}/kanban`).then((r) => r.data),
  });

  const kanban = data?.data;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/offers/${params.id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black">Kanban</h1>
            {kanban ? (
              <p className="text-sm text-muted-foreground">{kanban.offer.title}</p>
            ) : (
              <Skeleton className="h-4 w-48 mt-1" />
            )}
          </div>
        </div>

        {/* Assignee */}
        {kanban?.offer.assignee ? (
          <div className="flex items-center gap-2 rounded-full border px-3 py-1.5">
            <InitialsAvatar
              name={kanban.offer.assignee.name}
              size="xs"
              className="bg-primary/10 text-primary"
            />
            <span className="text-sm font-medium">{kanban.offer.assignee.name}</span>
          </div>
        ) : kanban ? (
          <span className="text-sm text-muted-foreground">Sin asignar</span>
        ) : null}
      </div>

      {/* Kanban board */}
      <div
        className="flex flex-row gap-4 overflow-x-auto pb-6"
        style={{ minHeight: "calc(100vh - 200px)" }}
      >
        {isLoading &&
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[280px] min-w-[280px] shrink-0 space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ))}

        {kanban?.stages.map((stage) => (
          <Card
            key={stage.id}
            className="h-fit min-h-[480px] w-[280px] min-w-[280px] flex-shrink-0"
          >
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="flex items-center justify-between text-sm font-black">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  {stage.name}
                  {stage.is_locked && (
                    <span className="text-[10px] text-muted-foreground">🔒</span>
                  )}
                </span>
                <Badge variant="secondary">{stage.applications.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stage.applications.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => router.push(`/dashboard/applications/${app.id}`)}
                  className="w-full rounded-xl border bg-background p-4 text-left shadow-sm transition hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-sm">
                        {app.candidate.full_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground" title={app.candidate.email}>
                        {app.candidate.email}
                      </p>
                    </div>
                    <InitialsAvatar
                      name={app.candidate.full_name}
                      size="xs"
                    />
                  </div>
                  {app.ai_score !== null && (
                    <div className="mt-2">
                      <AiScoreBadge score={app.ai_score} />
                    </div>
                  )}
                </button>
              ))}

              {stage.applications.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Sin candidatos
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
