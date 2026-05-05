"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useBulkApplyCandidates } from "@/hooks/useCandidates";
import { useOffers } from "@/hooks/useOffers";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { useTranslations } from "next-intl";

interface BulkApplyModalProps {
  candidateIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface OfferOption {
  id: string;
  title: string;
  company?: string | null;
  isUrgent?: boolean;
}

interface PipelineStageOption {
  id: string;
  name: string;
  category: string;
  order: number;
  slug: string;
}

export function BulkApplyModal({
  candidateIds,
  open,
  onOpenChange,
  onSuccess,
}: BulkApplyModalProps) {
  const t = useTranslations("candidates");
  const commonT = useTranslations("common");
  const [offerId, setOfferId] = useState("");
  const [pipelineStageId, setPipelineStageId] = useState("");
  const { data: offersResponse, isLoading: isOffersLoading } = useOffers("published");
  const { data: stages = [], isLoading: isStagesLoading } = usePipelineStages();
  const bulkApply = useBulkApplyCandidates();

  const offers: OfferOption[] = offersResponse?.data ?? [];
  const selectedOffer = offers.find((offer) => offer.id === offerId);
  const pendingStage = stages.find(
    (stage: PipelineStageOption) => stage.slug === "pending"
  );
  const selectedStageId = pipelineStageId || pendingStage?.id || "";

  const stagesByCategory = useMemo(() => {
    return stages.reduce(
      (groups: Record<string, PipelineStageOption[]>, stage: PipelineStageOption) => {
        groups[stage.category] = groups[stage.category] ?? [];
        groups[stage.category].push(stage);
        return groups;
      },
      {}
    );
  }, [stages]);

  const handleConfirm = async () => {
    if (!offerId) return;

    const result = await bulkApply.mutateAsync({
      candidateIds,
      offerId,
      pipelineStageId: selectedStageId || undefined,
    });

    const data = result.data;
    const offerName = selectedOffer
      ? `${selectedOffer.title}${selectedOffer.company ? ` @ ${selectedOffer.company}` : ""}`
      : "la oferta";

    toast({
      title:
        data.skipped > 0
          ? t("bulkApplyModal.successPartial", {
              created: data.created,
              skipped: data.skipped,
            })
          : t("bulkApplyModal.successAll", {
              created: data.created,
              offer: offerName,
            }),
    });

    onSuccess();
    onOpenChange(false);
    setOfferId("");
    setPipelineStageId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("bulkApplyModal.title")}</DialogTitle>
          <DialogDescription>
            {t("bulkApplyModal.subtitle", { count: candidateIds.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("wizard.linkedOffer")}</label>
            <Select value={offerId} onValueChange={setOfferId}>
              <SelectTrigger>
                <SelectValue placeholder={t("bulkApplyModal.selectOffer")} />
              </SelectTrigger>
              <SelectContent>
                {isOffersLoading ? (
                  <SelectItem value="loading" disabled>
                    {commonT("loading")}
                  </SelectItem>
                ) : (
                  offers.map((offer) => (
                    <SelectItem key={offer.id} value={offer.id}>
                      <span className="inline-flex items-center gap-2">
                        {offer.title}
                        {offer.company ? ` @ ${offer.company}` : ""}
                        {offer.isUrgent ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Urgente
                          </Badge>
                        ) : null}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("bulkApplyModal.selectStage")}
            </label>
            <Select value={selectedStageId} onValueChange={setPipelineStageId}>
              <SelectTrigger>
                <SelectValue placeholder={t("bulkApplyModal.selectStage")} />
              </SelectTrigger>
              <SelectContent>
                {isStagesLoading ? (
                  <SelectItem value="loading" disabled>
                    {commonT("loading")}
                  </SelectItem>
                ) : (
                  (Object.entries(stagesByCategory) as [
                    string,
                    PipelineStageOption[],
                  ][]).map(([category, categoryStages]) => (
                    <SelectGroup key={category}>
                      <SelectLabel className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                        {category}
                      </SelectLabel>
                      {categoryStages.map((stage: PipelineStageOption) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {t("bulkApplyModal.warning")}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {commonT("cancel")}
          </Button>
          <Button
            disabled={!offerId || bulkApply.isPending}
            onClick={handleConfirm}
          >
            {bulkApply.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("bulkApplyModal.loading")}
              </>
            ) : (
              t("bulkApplyModal.confirm", { count: candidateIds.length })
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
