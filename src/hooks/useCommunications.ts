import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

export function useCommunications({ applicationId, candidateId }: { applicationId?: string; candidateId?: string }) {
  const queryClient = useQueryClient();

  const { data: communications, isLoading } = useQuery({
    queryKey: ["communications", { applicationId, candidateId }],
    queryFn: async () => {
      const params: any = {};
      if (applicationId) params.application_id = applicationId;
      if (candidateId) params.candidate_id = candidateId;
      
      const { data } = await axios.get("/api/communications", { params });
      return data.data;
    },
    enabled: !!applicationId || !!candidateId,
  });

  const { data: templates } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data } = await axios.get("/api/email-templates");
      return data.data;
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (emailData: any) => axios.post("/api/outlook/send", emailData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", applicationId] });
      toast({ title: "Email sent successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.response?.data?.error?.message || "Internal error",
        variant: "destructive",
      });
    },
  });

  return {
    communications,
    isLoading,
    templates,
    sendEmail: sendEmailMutation.mutateAsync,
    isSending: sendEmailMutation.isPending,
  };
}
