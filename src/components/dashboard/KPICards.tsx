import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Briefcase, 
  Users, 
  FileText, 
  UserCheck, 
  Star, 
  ShieldAlert 
} from "lucide-react";
import { useTranslations } from "next-intl";

interface KPICardsProps {
  stats: any;
}

export function KPICards({ stats }: KPICardsProps) {
  const t = useTranslations("dashboard.kpi");
  const numberFormat = new Intl.NumberFormat("es-ES");
  const kpis = [
    {
      label: t("activeOffers"),
      value: numberFormat.format(stats.total_offers_active),
      icon: Briefcase,
      color: "text-primary",
      bg: "bg-lavender-light",
    },
    {
      label: t("totalCandidates"),
      value: numberFormat.format(stats.total_candidates),
      icon: Users,
      color: "text-primary",
      bg: "bg-lavender-light",
    },
    {
      label: t("applications"),
      value: numberFormat.format(stats.total_applications),
      icon: FileText,
      color: "text-primary",
      bg: "bg-lavender-light",
    },
    {
      label: t("hiredThisMonth"),
      value: numberFormat.format(stats.hired_this_month),
      icon: UserCheck,
      color: "text-primary",
      bg: "bg-lavender-light",
    },
    {
      label: t("avgAiScore"),
      value: `${numberFormat.format(Math.round(stats.avg_ai_score * 100))}%`,
      icon: Star,
      color: "text-primary",
      bg: "bg-lavender-light",
    },
    {
      label: t("gdprPending"),
      value: numberFormat.format(stats.candidates_pending_gdpr),
      icon: ShieldAlert,
      color: stats.candidates_pending_gdpr > 0 ? "text-rose-600" : "text-primary",
      bg: stats.candidates_pending_gdpr > 0 ? "bg-rose-500/10" : "bg-lavender-light",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi, i) => (
        <Card key={i} className="overflow-hidden border border-lavender-light shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-5">
            <div className={`p-2 w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors ${kpi.bg} ${kpi.color}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {kpi.label}
            </p>
            <h3 className="text-2xl font-black tracking-tight text-primary">
              {kpi.value}
            </h3>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
