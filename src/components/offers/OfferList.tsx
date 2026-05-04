"use client";

import React, { useState } from "react";
import { useOffers } from "@/hooks/useOffers";
import { OfferCard } from "./OfferCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Frown } from "lucide-react";
import { useTranslations } from "next-intl";

type ClosedSubFilter = "closed_hired" | "closed_no_hire" | null;

export function OfferList() {
  const [status, setStatus] = useState("all");
  const [closedSub, setClosedSub] = useState<ClosedSubFilter>(null);
  const t = useTranslations("offers");

  const effectiveStatus =
    status === "all" ? undefined : status === "closed" && closedSub ? closedSub : status;

  const { data, isLoading } = useOffers(effectiveStatus);
  const offers = data?.data || [];

  const handleTabChange = (value: string) => {
    setStatus(value);
    setClosedSub(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Tabs value={status} onValueChange={handleTabChange} className="w-auto">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="all">{t("filters.all")}</TabsTrigger>
              <TabsTrigger value="published">{t("filters.published")}</TabsTrigger>
              <TabsTrigger value="draft">{t("filters.draft")}</TabsTrigger>
              <TabsTrigger value="paused">{t("filters.paused")}</TabsTrigger>
              <TabsTrigger value="closed">{t("filters.closed")}</TabsTrigger>
            </TabsList>
          </Tabs>
          {status === "closed" && (
            <div className="flex gap-2 pl-1">
              <button
                onClick={() => setClosedSub(closedSub === "closed_hired" ? null : "closed_hired")}
                className={`rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors ${
                  closedSub === "closed_hired"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-muted-foreground/30 text-muted-foreground hover:border-slate-900 hover:text-slate-900"
                }`}
              >
                {t("filters.closedHired")}
              </button>
              <button
                onClick={() => setClosedSub(closedSub === "closed_no_hire" ? null : "closed_no_hire")}
                className={`rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors ${
                  closedSub === "closed_no_hire"
                    ? "border-rose-600 bg-rose-600 text-white"
                    : "border-muted-foreground/30 text-muted-foreground hover:border-rose-600 hover:text-rose-600"
                }`}
              >
                {t("filters.closedNoHire")}
              </button>
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground font-medium">
          {t("showing", { count: offers.length })}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[240px] rounded-2xl" />
          ))}
        </div>
      ) : offers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer: any) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
          <Frown className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-muted-foreground">{t("empty")}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t("emptyHint")}</p>
        </div>
      )}
    </div>
  );
}
