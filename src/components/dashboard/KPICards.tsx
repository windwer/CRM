import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Users, FileText, UserCheck, Star } from "lucide-react";
import type { DashboardKpis } from "@/types/dashboard";

interface KPICardsProps {
  stats: DashboardKpis;
}

export function KPICards({ stats }: KPICardsProps) {
  const numberFormat = new Intl.NumberFormat("es-ES");

  const kpis = [
    {
      label: "Ofertas activas",
      value: numberFormat.format(stats.total_offers_active),
      icon: Briefcase,
      color: "text-primary",
      bg: "bg-lavender-light",
    },
    {
      label: "Total candidatos",
      value: numberFormat.format(stats.total_candidates),
      icon: Users,
      color: "text-primary",
      bg: "bg-lavender-light",
    },
    {
      label: "Solicitudes (últimos 30 días)",
      value: numberFormat.format(stats.total_applications),
      icon: FileText,
      color: "text-primary",
      bg: "bg-lavender-light",
    },
    {
      label: "Contratados este mes",
      value: numberFormat.format(stats.hired_this_month),
      icon: UserCheck,
      color: "text-primary",
      bg: "bg-lavender-light",
    },
    {
      label: "Puntuación IA media",
      value: `${numberFormat.format(Math.round(stats.avg_ai_score * 100))}%`,
      icon: Star,
      color: "text-primary",
      bg: "bg-lavender-light",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
