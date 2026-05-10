"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Lock, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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

interface PipelineEditorProps {
  offerId: string;
  offerTitle: string;
  initialStages: PipelineStage[];
}

const MAX_INTERMEDIATE = 6;

export function PipelineEditor({ offerId, offerTitle, initialStages }: PipelineEditorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newStageName, setNewStageName] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [blockedModal, setBlockedModal] = useState<{ stageId: string; count: number } | null>(null);

  const stages = [...initialStages].sort((a, b) => a.order - b.order);
  const intermediates = stages.filter((s) => !s.isLocked);
  const canAddMore = intermediates.length < MAX_INTERMEDIATE;

  // Next available position (2–7)
  const usedPositions = new Set(stages.map((s) => s.order));
  let nextPosition = 2;
  while (usedPositions.has(nextPosition) && nextPosition <= 7) nextPosition++;

  const addStageMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post(`/api/offers/${offerId}/pipeline/stages`, {
        name: newStageName.trim(),
        position: nextPosition,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-settings"] });
      setNewStageName("");
      setIsAddOpen(false);
      toast({ title: "Stage añadido" });
    },
    onError: (err: any) => {
      toast({ title: err.response?.data?.error?.message ?? "Error", variant: "destructive" });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ stageId, name }: { stageId: string; name: string }) => {
      await axios.patch(`/api/offers/${offerId}/pipeline/stages/${stageId}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-settings"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ stageId, position }: { stageId: string; position: number }) => {
      await axios.patch(`/api/offers/${offerId}/pipeline/stages/${stageId}`, { position });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-settings"] });
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: async (stageId: string) => {
      await axios.delete(`/api/offers/${offerId}/pipeline/stages/${stageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-settings"] });
      toast({ title: "Stage eliminado" });
    },
    onError: (err: any) => {
      const errorData = err.response?.data?.error;
      if (err.response?.status === 409 && errorData?.candidate_count) {
        setBlockedModal({ stageId: "", count: errorData.candidate_count });
      } else {
        toast({ title: errorData?.message ?? "Error al eliminar", variant: "destructive" });
      }
    },
  });

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-widest mb-3">
        {offerTitle}
      </h3>

      <div className="space-y-1">
        {stages.map((stage, idx) => {
          const isFirstIntermediate = !stage.isLocked && intermediates[0]?.id === stage.id;
          const isLastIntermediate = !stage.isLocked && intermediates[intermediates.length - 1]?.id === stage.id;

          return (
            <div
              key={stage.id}
              className="flex items-center gap-2 rounded-lg border bg-card p-3 group"
            >
              <div
                className="w-2 h-6 rounded-sm shrink-0"
                style={{ backgroundColor: stage.color }}
              />
              <span className="text-xs text-muted-foreground w-5 shrink-0">{stage.order}</span>

              {stage.isLocked ? (
                <span className="flex-1 text-sm font-medium">{stage.name}</span>
              ) : (
                <Input
                  defaultValue={stage.name}
                  className="flex-1 h-7 text-sm border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  onBlur={(e) => {
                    const newName = e.target.value.trim();
                    if (newName && newName !== stage.name) {
                      renameMutation.mutate({ stageId: stage.id, name: newName });
                    }
                  }}
                />
              )}

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {stage.isLocked ? (
                  <>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    <Badge variant="secondary" className="text-[10px] h-5">Obligatorio</Badge>
                  </>
                ) : (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={isFirstIntermediate || reorderMutation.isPending}
                      onClick={() => reorderMutation.mutate({ stageId: stage.id, position: stage.order - 1 })}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      disabled={isLastIntermediate || reorderMutation.isPending}
                      onClick={() => reorderMutation.mutate({ stageId: stage.id, position: stage.order + 1 })}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => deleteStageMutation.mutate(stage.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        size="sm"
        variant="outline"
        className="w-full mt-2 border-dashed"
        disabled={!canAddMore || nextPosition > 7}
        onClick={() => setIsAddOpen(true)}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {canAddMore ? "Añadir stage intermedio" : "Máximo 6 stages intermedios"}
      </Button>

      {/* Add stage modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo estado intermedio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="stage-name">Nombre del estado</Label>
              <Input
                id="stage-name"
                maxLength={50}
                placeholder="Ej: En revisión técnica"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && newStageName.trim() && addStageMutation.mutate()}
              />
            </div>
            <p className="text-xs text-muted-foreground">Posición: {nextPosition}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
            <Button
              disabled={!newStageName.trim() || addStageMutation.isPending}
              onClick={() => addStageMutation.mutate()}
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blocked delete modal */}
      <Dialog open={!!blockedModal} onOpenChange={() => setBlockedModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>No se puede borrar este estado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Hay {blockedModal?.count} candidatos en este estado. Muévelos a otro estado antes de borrarlo.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockedModal(null)}>Cancelar</Button>
            <Button asChild>
              <a href={`/dashboard/applications?offer_id=${offerId}`}>Ver candidatos</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
