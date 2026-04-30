import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

export function useOffers(status?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["offers", status],
    queryFn: async () => {
      const { data } = await axios.get("/api/offers", {
        params: status ? { status } : {},
      });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newOffer: any) => axios.post("/api/offers", newOffer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast({ title: "Offer created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      axios.put(`/api/offers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast({ title: "Offer updated successfully" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      axios.patch(`/api/offers/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast({ title: "Offer status updated" });
    },
  });

  return {
    ...query,
    createOffer: createMutation.mutateAsync,
    updateOffer: updateMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

export function useOffer(id: string) {
  return useQuery({
    queryKey: ["offer", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/offers/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useOfferFunnel(id: string) {
  return useQuery({
    queryKey: ["offer-funnel", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/offers/${id}/funnel`);
      return data.data;
    },
    enabled: !!id,
  });
}
