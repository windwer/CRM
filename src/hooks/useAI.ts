import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

export function useAI() {
  const queryClient = useQueryClient();

  const parseMutation = useMutation({
    mutationFn: ({ candidateId, blobId }: { candidateId: string; blobId: string }) =>
      axios.post("/api/ai/parse-cv", { candidateId, blobId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["candidate"] });
      toast({ 
        title: "CV Parsed successfully", 
        description: `Extracted skills: ${response.data.data.parsedData.skills.length}` 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error parsing CV",
        description: error.response?.data?.error?.message || "AI failed to process the document",
        variant: "destructive",
      });
    },
  });

  const scoreMutation = useMutation({
    mutationFn: ({ candidateId, offerId, applicationId }: { candidateId: string; offerId: string; applicationId?: string }) =>
      axios.post("/api/ai/score-match", { candidateId, offerId, applicationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application"] });
      queryClient.invalidateQueries({ queryKey: ["candidate"] });
      toast({ title: "Matching score updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error scoring candidate",
        description: error.response?.data?.error?.message || "AI failed to calculate the score",
        variant: "destructive",
      });
    },
  });

  return {
    parseCV: parseMutation.mutateAsync,
    isParsing: parseMutation.isPending,
    scoreCandidate: scoreMutation.mutateAsync,
    isScoring: scoreMutation.isPending,
  };
}
