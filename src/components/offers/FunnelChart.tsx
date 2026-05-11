"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

type StageData = {
  id: string;
  name: string;
  slug: string;
  color: string;
  position: number;
  count: number;
};

interface FunnelChartProps {
  data: {
    stages?: StageData[];
    totalApplicants?: number;
    hired?: number;
    rejected?: number;
    // Legacy fallback
    applied?: number;
    prospects?: number;
    interviewing?: number;
    offers?: number;
    smartway?: number;
  };
}

export function FunnelChart({ data }: FunnelChartProps) {
  const t = useTranslations();

  const chartData = data.stages && data.stages.length > 0
    ? data.stages.map((s) => ({ name: s.name, value: s.count, fill: s.color }))
    : [];

  const hired = data.hired ?? 0;
  const rejected = data.rejected ?? 0;
  const totalApplicants = data.totalApplicants ?? data.applied ?? 0;
  const conversionRate = totalApplicants > 0 ? Math.round((hired / totalApplicants) * 100) : 0;

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          {t("offers.detail.funnel")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Sin datos de pipeline
          </div>
        ) : (
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fontWeight: 600 }}
                  width={120}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="value" position="right" style={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex justify-between items-center mt-6 pt-4 border-t text-xs font-medium">
          <div className="text-muted-foreground">
            {t("offers.totalRejections")}: <span className="text-rose-500 font-bold">{rejected}</span>
          </div>
          <div className="text-emerald-600 font-bold">
            {t("offers.conversionRate", { rate: conversionRate })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
