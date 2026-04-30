"use client";

import React, { useState } from "react";
import { useOffers } from "@/hooks/useOffers";
import { OfferCard } from "./OfferCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Frown } from "lucide-react";
import { useTranslations } from "next-intl";

export function OfferList() {
  const [status, setStatus] = useState("published");
  const { data, isLoading } = useOffers(status === "all" ? undefined : status);
  const t = useTranslations("offers");

  const offers = data?.data || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Tabs value={status} onValueChange={setStatus} className="w-auto">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="all">{t("filters.all")}</TabsTrigger>
            <TabsTrigger value="published">{t("filters.active")}</TabsTrigger>
            <TabsTrigger value="paused">{t("filters.paused")}</TabsTrigger>
            <TabsTrigger value="closed">{t("filters.closed")}</TabsTrigger>
          </TabsList>
        </Tabs>
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
