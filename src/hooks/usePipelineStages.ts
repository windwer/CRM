import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function usePipelineStages(offerId?: string | null) {
  return useQuery({
    queryKey: ["pipeline-stages", offerId ?? "template"],
    queryFn: async () => {
      const params = offerId ? { offerId } : {};
      const { data } = await axios.get("/api/pipeline-stages", { params });
      return data.data;
    },
    staleTime: Infinity,
    enabled: true,
  });
}
