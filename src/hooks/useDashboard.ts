import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";

const defaultDashboardStats = {
  kpis: {
    total_offers_active: 0,
    total_candidates: 0,
    total_applications: 0,
    hired_this_month: 0,
    avg_ai_score: 0,
    candidates_pending_gdpr: 0,
  },
  pipeline: {
    prospect: 0,
    applied: 0,
    screening: 0,
    interview: 0,
    offer: 0,
    hired: 0,
  },
  recent_activity: [],
  top_offers: [],
};

export function useDashboard() {
  const { status } = useSession();
  const isDev = process.env.NODE_ENV === "development";
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await axios.get("/api/dashboard/stats");
      return data.data;
    },
    enabled: isDev || status === "authenticated",
    refetchInterval: 60000, // Every 60 seconds
    staleTime: 30000,      // 30 seconds
  });

  return {
    stats: data ?? defaultDashboardStats,
    isLoading: (!isDev && status === "loading") || isLoading,
    isAuthenticated: isDev || status === "authenticated",
    error,
  };
}
