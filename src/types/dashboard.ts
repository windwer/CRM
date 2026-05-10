export type PipelineFunnelEntry = {
  slug: string;
  name: string;
  color: string;
  category: "todo" | "in_progress" | "done";
  order: number;
  count: number;
};

export type RecentActivityItem = {
  type: "email_sent" | "email_received" | "application_created" | "cv_parsed";
  candidate_name: string;
  offer_title: string;
  description: string;
  created_at: string | Date;
};

export type TopOfferItem = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  status: string;
  is_urgent: boolean;
  total_candidates: number;
  in_interview: number;
  hired: number;
};

export type DashboardKpis = {
  total_offers_active: number;
  total_candidates: number;
  total_applications: number;
  hired_this_month: number;
  avg_ai_score: number;
  candidates_pending_gdpr: number;
};

export type DashboardStats = {
  kpis: DashboardKpis;
  pendingGDPR: number;
  pipeline: PipelineFunnelEntry[];
  recent_activity: RecentActivityItem[];
  top_offers: TopOfferItem[];
};
