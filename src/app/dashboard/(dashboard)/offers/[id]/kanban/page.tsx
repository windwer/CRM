"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserCircle2 } from "lucide-react";
import { useApplications } from "@/hooks/useApplications";
import { useOffer } from "@/hooks/useOffers";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function OfferKanbanPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: offer } = useOffer(params.id);
  const { applications = [], isLoading } = useApplications({ offer_id: params.id, limit: 100 });
  const { data: stages = [] } = usePipelineStages();

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/offers/${params.id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black">Kanban</h1>
          <p className="text-sm text-muted-foreground">{offer?.title}</p>
        </div>
      </div>

      <div
        className="flex flex-row gap-4 overflow-x-auto overflow-y-visible pb-4"
        style={{ minHeight: "calc(100vh - 200px)" }}
      >
        {stages.map((stage: any) => {
          const stageApplications = applications.filter((application: any) => {
            if (application.pipelineStageId) return application.pipelineStageId === stage.id;
            return application.pipelineStage?.slug === stage.slug;
          });

          return (
            <Card key={stage.id} className="h-fit min-h-[520px] w-[280px] min-w-[280px] flex-shrink-0">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center justify-between text-sm font-black">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stage.color || "#94A3B8" }}
                    />
                    {stage.name}
                  </span>
                  <Badge variant="secondary">{stageApplications.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="h-24 animate-pulse rounded-xl bg-muted" />
                ) : (
                  stageApplications.map((application: any) => (
                    <button
                      key={application.id}
                      type="button"
                      onClick={() => router.push(`/dashboard/applications/${application.id}`)}
                      className="w-full rounded-xl border bg-background p-4 text-left shadow-sm transition hover:border-primary/50 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">{application.candidate.fullName}</p>
                          <p className="text-xs text-muted-foreground">{application.candidate.email}</p>
                        </div>
                        {application.assignedTo ? (
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={application.assignedTo.avatarUrl || undefined} />
                            <AvatarFallback>{application.assignedTo.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <UserCircle2 className="h-7 w-7 text-muted-foreground" />
                        )}
                      </div>
                      {application.aiScore && (
                        <Badge variant="outline" className="mt-3">
                          IA {Math.round(Number(application.aiScore) * 100)}%
                        </Badge>
                      )}
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
