"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, AlertCircle, Link as LinkIcon } from "lucide-react";
import { useOutlook } from "@/hooks/useOutlook";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export function OutlookSyncButton() {
  const { status, isLoading, isSyncing, triggerSync } = useOutlook();
  const t = useTranslations("settings.integrations.outlook");
  const navT = useTranslations("nav");
  const commonT = useTranslations("common");

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-40 bg-muted/20">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        {commonT("loading")}
      </Button>
    );
  }

  if (!status?.connected) {
    return (
      <Button 
        variant="default" 
        size="sm" 
        className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 font-bold text-xs"
        onClick={() => window.location.href = "/api/auth/signin/microsoft-entra-id"}
      >
        <LinkIcon className="mr-2 h-4 w-4" />
        {t("connect")}
      </Button>
    );
  }

  const isError = status.sync_status === "error";

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex flex-col items-end text-[10px] font-medium leading-tight">
        <span className="text-muted-foreground uppercase tracking-widest font-black">{t("connected")}</span>
        {status.last_sync_at ? (
          <span className="text-foreground/60 italic">
            {t("lastSync", { date: formatDistanceToNow(new Date(status.last_sync_at), { locale: es, addSuffix: true }) })}
          </span>
        ) : (
          <span className="text-amber-600 italic">{commonT("never")}</span>
        )}
      </div>

      <Button 
        variant={isError ? "destructive" : "outline"} 
        size="sm" 
        disabled={isSyncing} 
        onClick={() => triggerSync()}
        className={`
          relative h-9 px-4 font-bold text-xs transition-all
          ${isSyncing ? "bg-muted text-muted-foreground" : ""}
          ${isError ? "bg-rose-500 hover:bg-rose-600 text-white border-none shadow-lg shadow-rose-500/20" : "bg-background border-muted hover:border-primary/50 hover:bg-muted/30"}
        `}
      >
        {isSyncing ? (
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        ) : isError ? (
          <AlertCircle className="mr-2 h-4 w-4" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {isSyncing ? navT("syncOutlook") : isError ? commonT("error") : t("syncNow")}
        
        {/* Status indicator dot */}
        <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${status.sync_status === 'synced' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      </Button>
    </div>
  );
}
