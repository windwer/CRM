"use client";

import React, { useState } from "react";
import Link from "next/link";
import { differenceInDays } from "date-fns";
import { ArrowLeft, LayoutGrid, Loader2, Pause, Plus, Upload } from "lucide-react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useOffer, useOfferFunnel } from "@/hooks/useOffers";
import { FunnelChart } from "@/components/offers/FunnelChart";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { CloseOfferModal } from "@/components/offers/CloseOfferModal";
import { OfferDetailEditable } from "@/components/offers/OfferDetailEditable";

export default function OfferDetailPage({ params }: { params: { id: string } }) {
  const { data: offer, isLoading: isLoadingOffer } = useOffer(params.id);
  const { data: funnel, isLoading: isLoadingFunnel } = useOfferFunnel(params.id);
  const [isEditing, setIsEditing] = useState(false);
  const t = useTranslations("offers");
  const commonT = useTranslations("common");
  const queryClient = useQueryClient();

  if (isLoadingOffer || isLoadingFunnel) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">{t("notFound")}</h1>
        <Link href="/dashboard/offers">
          <Button variant="outline">{t("backToList")}</Button>
        </Link>
      </div>
    );
  }

  const daysOpen = differenceInDays(new Date(), new Date(offer.createdAt));
  const daysOpenLabel =
    daysOpen === 0
      ? t("detail.daysOpenToday")
      : daysOpen === 1
        ? t("detail.daysOpenOne")
        : t("detail.daysOpen", { days: daysOpen });

  const changeStatus = async (status: string) => {
    try {
      await axios.patch(`/api/offers/${params.id}/status`, { status });
      await queryClient.invalidateQueries({ queryKey: ["offer", params.id] });
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Estado actualizado" });
    } catch (error: any) {
      toast({
        title: commonT("error"),
        description: error.response?.data?.error?.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/offers">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div className="text-sm text-muted-foreground">
            {t("title")} / <span className="text-foreground font-medium">{offer.title}</span>
          </div>
        </div>
        <div className="flex gap-3">
          {!isEditing && (
            <>
              {offer.allowedTransitions?.includes("paused") && (
                <Button variant="outline" size="sm" onClick={() => changeStatus("paused")}>
                  <Pause className="mr-2 h-4 w-4" />
                  {t("actions.pause")}
                </Button>
              )}
              {offer.allowedTransitions?.includes("published") && (
                <Button variant="outline" size="sm" onClick={() => changeStatus("published")}>
                  <Upload className="mr-2 h-4 w-4" />
                  {offer.status === "closed_no_hire" ? t("actions.reopen") : t("actions.publish")}
                </Button>
              )}
              {(offer.allowedTransitions?.includes("closed_hired") ||
                offer.allowedTransitions?.includes("closed_no_hire")) && (
                <CloseOfferModal
                  offer={offer}
                  trigger={<Button variant="outline" size="sm">{t("actions.close")}</Button>}
                />
              )}
            </>
          )}
          <Link href={`/dashboard/offers/${params.id}/kanban`}>
            <Button variant="outline" size="sm">
              <LayoutGrid className="mr-2 h-4 w-4" />
              {t("viewKanban")}
            </Button>
          </Link>
          <Link href={`/dashboard/candidates/new?offerId=${params.id}`}>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t("addCandidate")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <OfferDetailEditable offer={offer} onEditingChange={setIsEditing} />
        </div>

        <div className="space-y-6">
          {funnel && <FunnelChart data={funnel} />}

          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary">{t("quickStats")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background rounded-2xl border shadow-sm">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">
                  {t("detail.daysOpen", { days: "" }).replace(" dias publicada", "")}
                </p>
                <p className="text-2xl font-black">{daysOpenLabel}</p>
              </div>
              <div className="p-4 bg-background rounded-2xl border shadow-sm">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">{t("applicants")}</p>
                <p className="text-2xl font-black">{funnel?.applied || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
