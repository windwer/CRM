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

interface FunnelChartProps {
  data: {
    prospects: number;
    applied: number;
    interviewing: number;
    offers: number;
    hired: number;
    smartway?: number;
    rejected: number;
  };
}

export function FunnelChart({ data }: FunnelChartProps) {
  const t = useTranslations();
  const chartData = [
    { name: t("applications.status.prospect"), value: data.prospects, fill: "#64748b" },
    { name: t("applications.status.applied"), value: data.applied, fill: "#3b82f6" },
    { name: t("applications.status.interview_1"), value: data.interviewing, fill: "#8b5cf6" },
    { name: t("applications.status.offer"), value: data.offers, fill: "#ec4899" },
    { name: t("applications.status.hired"), value: data.hired, fill: "#10b981" },
    { name: "BB.DD. SmartWay", value: data.smartway ?? 0, fill: "#0ea5e9" },
  ];

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          {t("offers.detail.funnel")}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                tick={{ fontSize: 12, fontWeight: 600 }}
                width={80}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList dataKey="value" position="right" style={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center mt-6 pt-4 border-t text-xs font-medium">
          <div className="text-muted-foreground">
            {t("offers.totalRejections")}: <span className="text-rose-500 font-bold">{data.rejected}</span>
          </div>
          <div className="text-emerald-600 font-bold">
            {t("offers.conversionRate", { rate: data.applied > 0 ? Math.round((data.hired / data.applied) * 100) : 0 })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
