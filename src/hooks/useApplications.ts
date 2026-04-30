import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

export function useApplications(filters?: any) {
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications", filters],
    queryFn: async () => {
      const { data } = await axios.get("/api/applications", { params: filters });
      return data.data;
    },
  });

  return {
    applications,
    isLoading,
  };
}

export function useApplication(id: string) {
  const queryClient = useQueryClient();

  const { data: application, isLoading, error } = useQuery({
    queryKey: ["application", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/applications/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => 
      axios.patch(`/api/applications/${id}/status`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({ title: "Application status updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.response?.data?.error?.message || "Internal error",
        variant: "destructive",
      });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: (notes: string) => 
      axios.patch(`/api/applications/${id}`, { internalNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", id] });
      toast({ title: "Notes updated" });
    },
  });

  return {
    application,
    isLoading,
    error,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    updateNotes: updateNotesMutation.mutateAsync,
  };
}
