export type PipelineFunnelEntry = {
  slug: string;
  name: string;
  color: string;
  category: "todo" | "in_progress" | "done";
  order: number;
  count: number;
};

export type DashboardStats = {
  kpis: {
    total_offers_active: number;
    total_candidates: number;
    total_applications: number;
    hired_this_month: number;
    avg_ai_score: number;
    candidates_pending_gdpr: number;
  };
  pendingGDPR: number;
  pipeline: PipelineFunnelEntry[];
  recent_activity: Array<Record<string, unknown>>;
  top_offers: Array<Record<string, unknown>>;
};
