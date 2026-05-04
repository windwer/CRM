"use client";

import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { useTranslations } from "next-intl";

const legacyStatusToSlug: Record<string, string> = {
  prospect: "pending",
  applied: "pending",
  screening: "sent_to_review",
  interview_1: "interview_internal",
  interview_2: "interview_client",
  interview_3: "interview_client",
  offer: "sent_to_review",
  hired: "hired",
  rejected: "rejected",
};

const categoryLabels: Record<string, string> = {
  todo: "todo",
  in_progress: "inProgress",
  done: "done",
};

interface StatusStepperProps {
  currentStatus: string;
  currentPipelineStageId?: string | null;
  onStatusChange: (payload: { pipelineStageId: string }) => Promise<void>;
  isUpdating: boolean;
}

export function StatusStepper({
  currentStatus,
  currentPipelineStageId,
  onStatusChange,
  isUpdating,
}: StatusStepperProps) {
  const { data: stages = [], isLoading } = usePipelineStages();
  const pipelineT = useTranslations("pipeline");
  const commonT = useTranslations("common");
  const fallbackSlug = legacyStatusToSlug[currentStatus?.toLowerCase()] || "pending";
  const activeStage =
    stages.find((stage: any) => stage.id === currentPipelineStageId) ||
    stages.find((stage: any) => stage.slug === fallbackSlug);
  const grouped = ["todo", "in_progress", "done"].map((category) => ({
    category,
    stages: stages.filter((stage: any) => stage.category === category),
  }));

  if (isLoading) {
    return <div className="h-28 animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.category} className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {pipelineT(categoryLabels[group.category])}
          </h3>
          <div className="flex flex-wrap gap-3">
            {group.stages.map((stage: any) => {
              const isActive = stage.id === activeStage?.id;
              return (
                <Dialog key={stage.id}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      disabled={isUpdating || isActive}
                      className={`rounded-xl border px-4 py-3 text-left transition hover:shadow-sm ${
                        isActive
                          ? "border-primary bg-primary/5 font-black text-primary shadow-sm"
                          : "bg-background font-semibold"
                      }`}
                    >
                      <span
                        className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: stage.color || "#94A3B8" }}
                      />
                      {stage.name}
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{pipelineT("changeStage")}</DialogTitle>
                      <DialogDescription>
                        {pipelineT("changeStageConfirm", { stage: stage.name })}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">{commonT("cancel")}</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button onClick={() => onStatusChange({ pipelineStageId: stage.id })}>
                          {commonT("confirm")}
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
