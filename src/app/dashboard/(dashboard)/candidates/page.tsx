"use client";

import React, { useState } from "react";
import { CandidateTable } from "@/components/candidates/CandidateTable";
import { SearchAdvanced } from "@/components/candidates/SearchAdvanced";
import { useCandidates } from "@/hooks/useCandidates";
import { useFilterStore } from "@/stores/filterStore";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

export default function CandidatesPage() {
  const t = useTranslations("candidates");
  const toastT = useTranslations("toasts");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const limit = 20;
  const { data, isLoading } = useCandidates(page, limit);
  const { candidateFilters } = useFilterStore();

  const totalPages = data?.meta?.total ? Math.ceil(data.meta.total / limit) : 0;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      candidateFilters.skills.forEach((skill) =>
        params.append("skills[]", skill)
      );
      params.append("skills_mode", candidateFilters.skillsMode);
      if (candidateFilters.experienceMin !== undefined) {
        params.append("exp_min", candidateFilters.experienceMin.toString());
      }
      if (candidateFilters.experienceMax !== undefined) {
        params.append("exp_max", candidateFilters.experienceMax.toString());
      }
      if (candidateFilters.seniority) {
        params.append("seniority", candidateFilters.seniority);
      }

      const response = await fetch(`/api/candidates/export?${params.toString()}`);
      if (!response.ok) {
        throw new Error(toastT("exportFailed"));
      }

      const truncated = response.headers.get("X-Truncated") === "true";
      if (truncated) {
        toast({
          title: t("exportTruncated", { max: 5000 }),
          variant: "destructive",
        });
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `candidatos-${date}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast({ title: t("exportSuccess") });
    } catch (error: any) {
      toast({
        title: toastT("exportFailed"),
        description: error.message || toastT("unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="hidden sm:flex"
            disabled={isExporting}
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            {t("export")}
          </Button>
          <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <UserPlus className="mr-2 h-4 w-4" />
            {t("addCandidate")}
          </Button>
        </div>
      </div>

      <SearchAdvanced />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            {t("search.results", { count: data?.meta?.total ?? 0 })}
          </div>
        </div>

        <CandidateTable candidates={data?.data ?? []} isLoading={isLoading} />

        {totalPages > 1 && (
          <div className="flex justify-center pt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <PaginationItem key={p}>
                      <PaginationLink 
                        onClick={() => setPage(p)}
                        isActive={page === p}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
