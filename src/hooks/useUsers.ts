import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useUsers() {
  return useQuery({
    queryKey: ["users-recruiters"],
    queryFn: async () => {
      const { data } = await axios.get("/api/settings/users", {
        params: { limit: 100 },
      });
      return (data.data || []).filter((user: any) =>
        ["recruiter", "admin"].includes(user.role)
      );
    },
  });
}
