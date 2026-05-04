"use client";

import React, { useState } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { UserCheck, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface CloseOfferModalProps {
  offer: any;
  trigger?: React.ReactNode;
}

export function CloseOfferModal({ offer, trigger }: CloseOfferModalProps) {
  const t = useTranslations("offers");
  const commonT = useTranslations("common");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"closed_hired" | "closed_no_hire">("closed_no_hire");
  const [hiredApplicationId, setHiredApplicationId] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const applications = offer.applications || [];

  const handleCloseOffer = async () => {
    setIsClosing(true);
    try {
      await axios.patch(`/api/offers/${offer.id}/status`, {
        status: mode,
        hiredApplicationId: mode === "closed_hired" ? hiredApplicationId : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["offer", offer.id] });
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: t("close.success") });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: commonT("error"),
        description: error.response?.data?.error?.message || "No se pudo cerrar la oferta",
        variant: "destructive",
      });
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">{t("actions.close")}</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("close.title")}</DialogTitle>
          <DialogDescription>{offer.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("closed_hired")}
              className={`rounded-2xl border p-5 text-left transition ${
                mode === "closed_hired" ? "border-emerald-500 bg-emerald-50" : "bg-background"
              }`}
            >
              <UserCheck className="mb-3 h-7 w-7 text-emerald-600" />
              <div className="font-black">{t("close.optionHired")}</div>
              <p className="mt-2 text-sm text-muted-foreground">{t("close.optionHiredDesc")}</p>
              <Badge className="mt-3" variant="secondary">{t("close.optionHiredBadge")}</Badge>
            </button>
            <button
              type="button"
              onClick={() => setMode("closed_no_hire")}
              className={`rounded-2xl border p-5 text-left transition ${
                mode === "closed_no_hire" ? "border-slate-500 bg-slate-50" : "bg-background"
              }`}
            >
              <XCircle className="mb-3 h-7 w-7 text-slate-600" />
              <div className="font-black">{t("close.optionNoHire")}</div>
              <p className="mt-2 text-sm text-muted-foreground">{t("close.optionNoHireDesc")}</p>
              <Badge className="mt-3" variant="outline">{t("close.optionNoHireBadge")}</Badge>
            </button>
          </div>

          {mode === "closed_hired" ? (
            <div className="space-y-3">
              <h3 className="font-black">{t("close.selectHired")}</h3>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-2">
                {applications.map((application: any) => (
                  <button
                    key={application.id}
                    type="button"
                    onClick={() => setHiredApplicationId(application.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                      hiredApplicationId === application.id ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <Avatar>
                      <AvatarFallback>{application.candidate.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{application.candidate.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{application.candidate.email}</p>
                    </div>
                    {application.pipelineStage && (
                      <Badge
                        variant="outline"
                        style={{ borderColor: application.pipelineStage.color || undefined }}
                      >
                        {application.pipelineStage.name}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900">
                {t("close.warningOthers")}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-blue-300 bg-blue-50 p-4 text-sm font-medium text-blue-900">
              {t("close.warningNoHire")}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isClosing}>
            {commonT("cancel")}
          </Button>
          <Button
            variant={mode === "closed_hired" ? "default" : "secondary"}
            onClick={handleCloseOffer}
            disabled={isClosing || (mode === "closed_hired" && !hiredApplicationId)}
          >
            {isClosing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isClosing ? t("close.closing") : t("close.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
