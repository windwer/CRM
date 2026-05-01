import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

export function useOutlook() {
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ["outlook-status"],
    queryFn: async () => {
      const { data } = await axios.get("/api/outlook/status");
      return data.data;
    },
    refetchInterval: 30000, // Every 30 seconds
  });

  const syncMutation = useMutation({
    mutationFn: () => axios.post("/api/outlook/sync"),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["outlook-status"] });
      queryClient.invalidateQueries({ queryKey: ["communications"] });
      toast({ 
        title: "Sync completed", 
        description: `Synced ${response.data.data.synced_emails} emails, ${response.data.data.new_communications} matched.` 
      });
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ["outlook-status"] });
      toast({
        title: "Sync failed",
        description: error.response?.data?.error?.message || "Check your connection",
        variant: "destructive",
      });
    },
  });

  return {
    status,
    isLoading,
    isSyncing: syncMutation.isPending,
    triggerSync: syncMutation.mutateAsync,
  };
}
