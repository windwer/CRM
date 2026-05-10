"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft, ChevronDown, ChevronRight, GitBranch, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PipelineEditor } from "@/components/settings/PipelineEditor";

interface PipelineStage {
  id: string;
  name: string;
  slug: string;
  order: number;
  color: string;
  category: string;
  isLocked: boolean;
  isEditable: boolean;
}

interface OfferPipeline {
  offer_id: string;
  offer_title: string;
  stages: PipelineStage[];
}

interface PipelineData {
  templates: PipelineStage[];
  by_offer: OfferPipeline[];
}

export default function FlujosDeOfertaPage() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<PipelineData>({
    queryKey: ["pipeline-settings"],
    queryFn: async () => {
      const { data } = await axios.get("/api/settings/pipelines");
      return data.data;
    },
  });

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Flujos de oferta</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los estados del pipeline para cada oferta.
          </p>
        </div>
      </div>

      {/* Template global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4" />
            Plantilla global — Estándar
          </CardTitle>
          <CardDescription>
            Los 4 estados obligatorios se clonan automáticamente en cada nueva oferta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {(data?.templates ?? []).map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-2 rounded-lg border bg-muted/20 p-3"
                >
                  <div
                    className="w-2 h-6 rounded-sm shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-xs text-muted-foreground w-5">{stage.order}</span>
                  <span className="flex-1 text-sm font-medium">{stage.name}</span>
                  {stage.isLocked && (
                    <div className="flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      <Badge variant="secondary" className="text-[10px] h-5">
                        Obligatorio
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-offer pipelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipelines por oferta</CardTitle>
          <CardDescription>
            Añade o reorganiza estados intermedios (posiciones 2–7) para cada oferta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (data?.by_offer ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No hay ofertas activas con pipeline configurado.
            </p>
          ) : (
            <div className="space-y-2">
              {(data?.by_offer ?? []).map((op) => {
                const isOpen = expanded.has(op.offer_id);
                return (
                  <div key={op.offer_id} className="border rounded-lg">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors rounded-lg"
                      onClick={() => toggle(op.offer_id)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{op.offer_title}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {op.stages.length} estados
                        </Badge>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <PipelineEditor
                          offerId={op.offer_id}
                          offerTitle={op.offer_title}
                          initialStages={op.stages}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
