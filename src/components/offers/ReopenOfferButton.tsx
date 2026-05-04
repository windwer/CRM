"use client";

import React, { useState } from "react";
import axios from "axios";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

export function ReopenOfferButton({ offerId }: { offerId: string }) {
  const t = useTranslations("offers");
  const commonT = useTranslations("common");
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const reopen = async () => {
    setIsLoading(true);
    try {
      await axios.patch(`/api/offers/${offerId}/status`, { status: "published" });
      await queryClient.invalidateQueries({ queryKey: ["offer", offerId] });
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: t("close.successReopen") });
    } catch (error: any) {
      toast({
        title: commonT("error"),
        description: error.response?.data?.error?.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("actions.reopen")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("actions.reopen")}</DialogTitle>
          <DialogDescription>{t("close.confirmReopen")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{commonT("cancel")}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={reopen} disabled={isLoading}>
              {commonT("confirm")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
