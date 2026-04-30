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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface PipelineFunnelProps {
  data: Record<string, number>;
}

export function PipelineFunnel({ data }: PipelineFunnelProps) {
  const router = useRouter();
  const t = useTranslations();
  
  const chartData = [
    { key: "prospect", name: t("applications.status.prospect"), count: data.prospect || 0, color: "#94a3b8" },
    { key: "applied", name: t("applications.status.applied"), count: data.applied || 0, color: "#64748b" },
    { key: "screening", name: t("applications.status.screening"), count: data.screening || 0, color: "#475569" },
    { key: "interview_1", name: t("applications.status.interview_1"), count: data.interview || 0, color: "#334155" },
    { key: "offer", name: t("applications.status.offer"), count: data.offer || 0, color: "#1e293b" },
    { key: "hired", name: t("applications.status.hired"), count: data.hired || 0, color: "#10b981" },
  ];

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {t("dashboard.pipeline.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            onClick={(state) => {
              if (state && state.activeLabel) {
                const item = chartData.find((entry) => entry.name === state.activeLabel);
                const status = item?.key || String(state.activeLabel).toLowerCase();
                router.push(`/dashboard/applications?status=${status}`);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fontSize: 12, fontWeight: 700, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} className="cursor-pointer hover:opacity-80 transition-opacity" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
