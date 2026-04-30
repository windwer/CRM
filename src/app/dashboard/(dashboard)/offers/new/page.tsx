"use client";

import React from "react";
import { OfferForm } from "@/components/offers/OfferForm";
import { useOffers } from "@/hooks/useOffers";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NewOfferPage() {
  const router = useRouter();
  const { createOffer, isCreating } = useOffers();
  const t = useTranslations("offers");

  const handleSubmit = async (data: any) => {
    try {
      await createOffer(data);
      router.push("/dashboard/offers");
    } catch (error) {
      // Error handled by hook toast
    }
  };

  return (
    <div className="p-8 max-w-[1000px] mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/offers">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="text-sm text-muted-foreground">
          {t("title")} / <span className="text-foreground font-medium">{t("breadcrumbNew")}</span>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-black">{t("createTitle")}</h1>
        <p className="text-muted-foreground">{t("createSubtitle")}</p>
      </div>

      <OfferForm onSubmit={handleSubmit} isLoading={isCreating} />
    </div>
  );
}
