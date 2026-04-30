import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useCandidate(id: string) {
  return useQuery({
    queryKey: ["candidate", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/candidates/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}
