"use client";

import React from "react";
import { Check } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

const STAGES = [
  "prospect",
  "applied",
  "screening",
  "interview_1",
  "interview_2",
  "interview_3",
  "offer",
  "hired"
];

interface StatusStepperProps {
  currentStatus: string;
  onStatusChange: (status: string) => Promise<void>;
  isUpdating: boolean;
}

export function StatusStepper({ currentStatus, onStatusChange, isUpdating }: StatusStepperProps) {
  const t = useTranslations("applications");
  const commonT = useTranslations("common");
  const currentIndex = STAGES.indexOf(currentStatus?.toLowerCase() || "");
  const isRejected = currentStatus?.toLowerCase() === "rejected";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4 custom-scrollbar">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <React.Fragment key={stage}>
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    disabled={isUpdating || isActive || isRejected}
                    className={`
                      flex flex-col items-center gap-2 group min-w-[80px] transition-all
                      ${isActive ? "scale-110" : "hover:scale-105"}
                      ${isRejected ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <div className={`
                      h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors
                      ${isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : ""}
                      ${isActive ? "bg-primary border-primary text-white shadow-lg shadow-primary/30" : ""}
                      ${isPending ? "bg-background border-muted text-muted-foreground" : ""}
                    `}>
                      {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                    </div>
                    <span className={`
                      text-[10px] font-black uppercase tracking-widest transition-colors
                      ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}
                    `}>
                      {t(`status.${stage}`)}
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("detail.changeStatus")}</DialogTitle>
                    <DialogDescription>
                      {t("detail.confirmChange", { status: t(`status.${stage}`) })}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">{commonT("cancel")}</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button onClick={() => onStatusChange(stage)}>
                        {commonT("confirm")}
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {index < STAGES.length - 1 && (
                <div className={`h-[2px] w-full min-w-[20px] mx-2 ${isCompleted ? "bg-emerald-500" : "bg-muted"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {isRejected && (
        <div className="flex justify-center">
          <Badge variant="destructive" className="px-8 py-2 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20">
            {t("status.rejected")}
          </Badge>
        </div>
      )}
    </div>
  );
}
