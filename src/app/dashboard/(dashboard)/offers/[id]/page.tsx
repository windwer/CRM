"use client";

import React from "react";
import { useOffer, useOfferFunnel } from "@/hooks/useOffers";
import { FunnelChart } from "@/components/offers/FunnelChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Settings, 
  Users, 
  ExternalLink, 
  Briefcase,
  MapPin,
  Building2,
  Calendar,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslations } from "next-intl";

export default function OfferDetailPage({ params }: { params: { id: string } }) {
  const { data: offer, isLoading: isLoadingOffer } = useOffer(params.id);
  const { data: funnel, isLoading: isLoadingFunnel } = useOfferFunnel(params.id);
  const t = useTranslations("offers");
  const commonT = useTranslations("common");

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

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
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
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            {commonT("edit")}
          </Button>
          <Button size="sm">
            <Users className="mr-2 h-4 w-4" />
            {t("detail.candidates")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card border rounded-3xl p-8 space-y-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter">{offer.title}</h1>
                <div className="flex flex-wrap gap-4 text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <Building2 size={16} className="text-primary" />
                    {offer.department}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-primary" />
                    {offer.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={16} className="text-primary" />
                    {t("publishedOn", { date: format(new Date(offer.createdAt), "dd/MM/yyyy", { locale: es }) })}
                  </span>
                </div>
              </div>
              <Badge className="text-lg px-4 py-1 capitalize bg-emerald-500 hover:bg-emerald-600">
                {t(`status.${offer.status}`)}
              </Badge>
            </div>

            <div className="flex gap-3">
              <Badge variant="secondary" className="px-3 py-1 uppercase tracking-wider text-[10px] font-bold">
                {t(`jobType.${offer.jobType || "full_time"}`)}
              </Badge>
              {offer.salaryMin && (
                <Badge variant="outline" className="px-3 py-1 font-bold">
                  {t("salaryYear", {
                    min: new Intl.NumberFormat("es-ES").format(offer.salaryMin),
                    max: new Intl.NumberFormat("es-ES").format(offer.salaryMax)
                  })}
                </Badge>
              )}
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold">{t("form.description")}</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {offer.description}
              </p>
            </div>

            {offer.requirements && (
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-bold">{t("form.requirements")}</h3>
                <div className="bg-muted/30 rounded-2xl p-6 border-2 border-dashed">
                  <p className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
                    {offer.requirements}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {funnel && <FunnelChart data={funnel} />}
          
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary">{t("quickStats")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background rounded-2xl border shadow-sm">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">{t("detail.daysOpen", { days: "" }).replace(" días publicada", "")}</p>
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
