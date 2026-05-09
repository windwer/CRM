"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { PipelineFunnelEntry } from "@/types/dashboard";

interface PipelineFunnelProps {
  data: PipelineFunnelEntry[];
}

export function PipelineFunnel({ data }: PipelineFunnelProps) {
  const router = useRouter();
  const t = useTranslations();
  const pipeline = data ?? [];
  const total = pipeline.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-baseline justify-between gap-4">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {t("dashboard.pipeline.title")}
        </CardTitle>
        <span className="text-sm text-muted-foreground">{total} candidatos en total</span>
      </CardHeader>
      <CardContent className="min-h-[300px]" style={{ height: Math.max(300, pipeline.length * 36) }}>
        {pipeline.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay stages configurados.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={pipeline}
              margin={{ top: 0, right: 24, left: 12, bottom: 0 }}
            >
              <defs>
                <linearGradient id="smartwayPipelineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#211CC3" />
                  <stop offset="100%" stopColor="#9290E2" />
                </linearGradient>
              </defs>
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={180}
                tick={{ fontSize: 12, fontWeight: 700, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                formatter={(value) => [`${Number(value ?? 0)} candidatos`, "Total"]}
                labelFormatter={(label) => label as string}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar
                dataKey="count"
                cursor="pointer"
                radius={[0, 4, 4, 0]}
                barSize={28}
                onClick={(entry) => {
                  const stage = entry as unknown as PipelineFunnelEntry;
                  router.push(`/dashboard/applications?stage=${stage.slug}`);
                }}
              >
                {pipeline.map((entry) => (
                  <Cell
                    key={entry.slug}
                    fill="url(#smartwayPipelineGradient)"
                    className="cursor-pointer transition-opacity hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
