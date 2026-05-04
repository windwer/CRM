"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  skillsArray: string[];
  experienceYears: number;
  seniorityLevel: string;
  createdAt: string;
  archivedAt?: string | null;
  applications?: Array<{
    status: string;
    pipelineStage?: { slug: string } | null;
    offer?: { status: string } | null;
  }>;
}

interface CandidateTableProps {
  candidates: Candidate[];
  isLoading: boolean;
}

const columnHelper = createColumnHelper<Candidate>();

export function CandidateTable({ candidates, isLoading }: CandidateTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("candidates");
  const commonT = useTranslations("common");
  const toastT = useTranslations("toasts");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"archive">("archive");
  const selectedCount = selectedIds.size;
  const visibleIds = useMemo(
    () => candidates.map((candidate) => candidate.id),
    [candidates]
  );
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  useEffect(() => {
    setSelectedIds((current) => {
      const visible = new Set(visibleIds);
      const next = new Set(Array.from(current).filter((id) => visible.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [visibleIds]);

  const bulkArchiveMutation = useMutation({
    mutationFn: async () =>
      axios.patch("/api/candidates/bulk-update", {
        candidate_ids: Array.from(selectedIds),
        action: bulkAction,
      }),
    onSuccess: (response) => {
      const count = response.data?.data?.count ?? selectedCount;
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      setSelectedIds(new Set());
      setConfirmOpen(false);
      toast({ title: t("bulkSuccess", { count }) });
    },
    onError: (error: any) => {
      toast({
        title: toastT("bulkFailed"),
        description: error.response?.data?.error?.message || toastT("unknownError"),
        variant: "destructive",
      });
    },
  });

  const toggleSelection = useCallback((candidateId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(candidateId)) {
        next.delete(candidateId);
      } else {
        next.add(candidateId);
      }
      return next;
    });
  }, []);

  const toggleAllVisible = useCallback(() => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allVisibleSelected, visibleIds]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: () => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-muted-foreground"
            checked={allVisibleSelected}
            aria-label={t("table.selectAll")}
            onChange={toggleAllVisible}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        cell: (info) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-muted-foreground"
            checked={selectedIds.has(info.row.original.id)}
            aria-label={t("table.selectCandidate", { name: info.row.original.fullName })}
            onChange={() => toggleSelection(info.row.original.id)}
            onClick={(event) => event.stopPropagation()}
          />
        ),
      }),
      columnHelper.accessor("fullName", {
        header: t("table.name"),
        cell: (info) => (
          <div className="space-y-1">
            <div className="font-semibold text-foreground">{info.getValue()}</div>
            {info.row.original.applications?.some(
              (application) =>
                ["closed_hired", "closed_no_hire"].includes(application.offer?.status || "") &&
                (application.pipelineStage?.slug === "pending" || application.status === "prospect")
            ) && (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-800">
                {t("pendingCommunication")}
              </Badge>
            )}
          </div>
        ),
      }),
      columnHelper.accessor("email", {
        header: t("table.email"),
        cell: (info) => <div className="text-muted-foreground">{info.getValue()}</div>,
      }),
      columnHelper.accessor("skillsArray", {
        header: t("table.skills"),
        cell: (info) => (
          <div className="flex flex-wrap gap-1 max-w-[300px]">
            {info.getValue()?.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[10px] py-0 px-1.5 font-medium">
                {skill}
              </Badge>
            ))}
            {(info.getValue()?.length || 0) > 4 && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                +{(info.getValue()?.length || 0) - 4}
              </Badge>
            )}
          </div>
        ),
      }),
      columnHelper.accessor("experienceYears", {
        header: t("table.experience"),
        cell: (info) => (
          <div className="text-center tabular-nums">
            {t("yearsShort", { years: info.getValue() })}
          </div>
        ),
      }),
      columnHelper.accessor("seniorityLevel", {
        header: t("table.seniority"),
        cell: (info) => (
          <Badge className="capitalize font-normal text-xs">
            {info.getValue() ? t(`search.seniorityOptions.${info.getValue()}`) : t("search.seniorityOptions.mid")}
          </Badge>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: t("registered"),
        cell: (info) => (
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(info.getValue()), { locale: es, addSuffix: true })}
          </div>
        ),
      }),
    ],
    [allVisibleSelected, selectedIds, toggleAllVisible, toggleSelection, t]
  );

  const table = useReactTable({
    data: candidates,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="border rounded-xl overflow-hidden bg-card">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedCount > 0 && (
        <div className="sticky top-4 z-20 mb-3 flex flex-col gap-3 rounded-lg border bg-background p-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium">
            {t("bulkArchive", { count: selectedCount })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={bulkAction}
              onValueChange={(value: "archive") => setBulkAction(value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("bulkChangeTo")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="archive">{t("archive")}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setConfirmOpen(true)}>{commonT("confirm")}</Button>
            <Button
              variant="outline"
              onClick={() => setSelectedIds(new Set())}
            >
              {commonT("cancel")}
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-muted-foreground font-medium text-xs h-10 px-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors border-b last:border-none"
                  onClick={() => router.push(`/dashboard/candidates/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("bulkConfirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("bulkConfirm", { count: selectedCount })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {commonT("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={bulkArchiveMutation.isPending}
              onClick={() => bulkArchiveMutation.mutate()}
            >
              {t("archive")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
