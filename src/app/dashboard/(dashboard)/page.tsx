"use client";

import React, { useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { KPICards } from "@/components/dashboard/KPICards";
import { PipelineFunnel } from "@/components/dashboard/PipelineFunnel";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TopOffers } from "@/components/dashboard/TopOffers";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OutlookSyncButton } from "@/components/communications/OutlookSyncButton";
import { useOffers } from "@/hooks/useOffers";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const [selectedOfferId, setSelectedOfferId] = useState<string | undefined>(undefined);
  const { stats, isLoading } = useDashboard(selectedOfferId);
  const { data: offersData } = useOffers("active");
  const t = useTranslations("dashboard");

  const offers: Array<{ id: string; title: string }> = (offersData?.data ?? []).slice(0, 20);

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {t("subtitle")}
          </p>
        </div>
        <OutlookSyncButton />
      </div>

      <KPICards stats={stats.kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Funnel de candidatos
              </CardTitle>
              <Select
                value={selectedOfferId ?? "__all__"}
                onValueChange={(v) => setSelectedOfferId(v === "__all__" ? undefined : v)}
              >
                <SelectTrigger className="w-48 h-8 text-xs">
                  <SelectValue placeholder="Todas las ofertas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas las ofertas</SelectItem>
                  {offers.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <PipelineFunnel data={stats.pipeline} />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {t("topOffers.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TopOffers offers={stats.top_offers} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {t("recentActivity.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
              <RecentActivity activities={stats.recent_activity} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
