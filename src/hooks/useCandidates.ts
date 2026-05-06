import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useFilterStore } from "@/stores/filterStore";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import type { candidateUpdateSchema } from "@/lib/validations/candidate";

type CandidateUpdateInput = z.infer<typeof candidateUpdateSchema>;

export function useCandidates(page = 1, limit = 20) {
  const queryClient = useQueryClient();
  const { candidateFilters } = useFilterStore();

  const isFiltering = 
    candidateFilters.skills.length > 0 || 
    candidateFilters.experienceMin !== undefined || 
    candidateFilters.experienceMax !== undefined || 
    candidateFilters.seniority !== undefined;

  const fetchCandidates = async () => {
    const endpoint = isFiltering ? "/api/candidates/search" : "/api/candidates";
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (isFiltering) {
      candidateFilters.skills.forEach(skill => params.append("skills[]", skill));
      if (candidateFilters.skillsMode) params.append("skills_mode", candidateFilters.skillsMode);
      if (candidateFilters.experienceMin !== undefined) params.append("exp_min", candidateFilters.experienceMin.toString());
      if (candidateFilters.experienceMax !== undefined) params.append("exp_max", candidateFilters.experienceMax.toString());
      if (candidateFilters.seniority) params.append("seniority", candidateFilters.seniority);
    }

    const { data } = await axios.get(endpoint, { params });
    return data;
  };

  const query = useQuery({
    queryKey: ["candidates", page, limit, candidateFilters, isFiltering],
    queryFn: fetchCandidates,
  });

  const createMutation = useMutation({
    mutationFn: (newCandidate: any) => axios.post("/api/candidates", newCandidate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast({ title: "Candidate created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating candidate", 
        description: error.response?.data?.error?.message || "Unknown error",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      axios.put(`/api/candidates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast({ title: "Candidate updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/candidates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast({ title: "Candidate archived successfully" });
    },
  });

  return {
    ...query,
    createCandidate: createMutation.mutateAsync,
    updateCandidate: updateMutation.mutateAsync,
    deleteCandidate: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useBulkApplyCandidates() {
  const queryClient = useQueryClient();
  const t = useTranslations("errors");

  return useMutation({
    mutationFn: async (data: {
      candidateIds: string[];
      offerId: string;
      pipelineStageId?: string;
    }) => {
      const response = await api.post("/candidates/bulk-apply", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error: any) => {
      toast({
        title:
          error?.response?.data?.error?.message ?? t("serverError"),
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCandidate(candidateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CandidateUpdateInput) => {
      const response = await api.put(`/candidates/${candidateId}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", candidateId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
