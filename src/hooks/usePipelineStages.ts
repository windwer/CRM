import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function usePipelineStages() {
  return useQuery({
    queryKey: ["pipeline-stages"],
    queryFn: async () => {
      const { data } = await axios.get("/api/pipeline-stages");
      return data.data;
    },
    staleTime: Infinity,
  });
}
