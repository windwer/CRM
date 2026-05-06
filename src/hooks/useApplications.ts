import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

type ApplicationFilters = {
  offer_id?: string;
  candidate_id?: string;
  offerId?: string;
  candidateId?: string;
  stage?: string;
  page?: number;
  limit?: number;
};

export function useApplications(filters: ApplicationFilters = {}) {
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications", filters],
    queryFn: async () => {
      const params = {
        ...filters,
        offer_id: filters.offer_id ?? filters.offerId,
        candidate_id: filters.candidate_id ?? filters.candidateId,
        offerId: undefined,
        candidateId: undefined,
      };
      const { data } = await axios.get("/api/applications", { params });
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

  const updateStageMutation = useMutation({
    mutationFn: (payload: { pipelineStageId: string }) =>
      axios.patch(`/api/applications/${id}/stage`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["offer"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Etapa actualizada" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar la etapa",
        description: error.response?.data?.error?.message || "Internal error",
        variant: "destructive",
      });
    },
  });

  const updateNotes = useMutation({
    mutationFn: async ({
      internal_notes,
      candidateNotes,
    }: {
      id: string;
      internal_notes?: string;
      candidateNotes?: string;
    }) => {
      const response = await axios.patch(`/api/applications/${id}`, {
        internal_notes,
        candidateNotes,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["application", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({ title: "Nota guardada correctamente" });
    },
    onError: (error: any) => {
      toast({
        title: "Error al guardar la nota. Inténtalo de nuevo.",
        description: error.response?.data?.error?.message,
        variant: "destructive",
      });
    },
  });

  const assignMutation = useMutation({
    mutationFn: (assignedToId: string | null) =>
      axios.patch(`/api/applications/${id}/assign`, { assignedToId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({ title: "Responsable actualizado" });
    },
    onError: (error: any) => {
      toast({
        title: "No se pudo actualizar el responsable",
        description: error.response?.data?.error?.message,
        variant: "destructive",
      });
    },
  });

  return {
    application,
    isLoading,
    error,
    updateStage: updateStageMutation.mutateAsync,
    isUpdatingStage: updateStageMutation.isPending,
    updateNotes: updateNotes.mutateAsync,
    isUpdatingNotes: updateNotes.isPending,
    assignUser: assignMutation.mutateAsync,
    isAssigning: assignMutation.isPending,
  };
}
