"use client";

import React from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { KPICards } from "@/components/dashboard/KPICards";
import { PipelineFunnel } from "@/components/dashboard/PipelineFunnel";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TopOffers } from "@/components/dashboard/TopOffers";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OutlookSyncButton } from "@/components/communications/OutlookSyncButton";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const { stats, isLoading } = useDashboard();
  const t = useTranslations("dashboard");

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <PipelineFunnel data={stats.pipeline} />
          
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
