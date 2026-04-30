"use client";

import React from "react";
import { OfferList } from "@/components/offers/OfferList";
import { Button } from "@/components/ui/button";
import { Plus, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function OffersPage() {
  const t = useTranslations("offers");

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex">
            <BarChart2 className="mr-2 h-4 w-4" />
            {t("analytics")}
          </Button>
          <Link href="/dashboard/offers/new">
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              {t("newOffer")}
            </Button>
          </Link>
        </div>
      </div>

      <OfferList />
    </div>
  );
}
