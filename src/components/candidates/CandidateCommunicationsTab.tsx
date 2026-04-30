"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Mail,
  Phone,
  StickyNote,
  Users,
} from "lucide-react";
import { useCommunications } from "@/hooks/useCommunications";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type CandidateCommunication = {
  id: string;
  type: string;
  subject: string | null;
  body: string | null;
  sentAt: string;
  isOutbound: boolean;
  emailFrom?: string | null;
  sender?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

function getTypeIcon(type: string) {
  switch (type) {
    case "email":
      return Mail;
    case "call":
      return Phone;
    case "meeting":
      return Users;
    default:
      return StickyNote;
  }
}

function getTypeClass(type: string) {
  switch (type) {
    case "email":
      return "border-blue-500/30 bg-blue-500/10 text-blue-700";
    case "call":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700";
    case "meeting":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-700";
    default:
      return "border-muted-foreground/20 bg-muted text-muted-foreground";
  }
}

export function CandidateCommunicationsTab({ candidateId }: { candidateId: string }) {
  const t = useTranslations("communications");
  const candidateT = useTranslations("candidates.detail");
  const commonT = useTranslations("common");
  const { communications, isLoading } = useCommunications({ candidateId });
  const rows = (communications ?? []) as CandidateCommunication[];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed bg-muted/10 p-16 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <h3 className="text-base font-bold text-foreground">
          {candidateT("noCommunications")}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
          {candidateT("noCommunicationsHint") || "No hay registros de correos o llamadas con este candidato."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((communication) => {
        const TypeIcon = getTypeIcon(communication.type);
        const DirectionIcon = communication.isOutbound ? ArrowUpRight : ArrowDownLeft;
        const directionLabel = communication.isOutbound ? t("outbound") : t("inbound");

        return (
          <div
            key={communication.id}
            className="group flex items-start justify-between gap-4 rounded-2xl border bg-background p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex min-w-0 gap-4">
              <div
                className={cn(
                  "mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                  communication.isOutbound
                    ? "bg-primary/10 text-primary group-hover:bg-primary/20"
                    : "bg-indigo-500/10 text-indigo-700 group-hover:bg-indigo-500/20"
                )}
              >
                <DirectionIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("capitalize px-2 py-0.5 text-[10px] font-bold", getTypeClass(communication.type))}
                  >
                    <TypeIcon className="mr-1.5 h-3 w-3" />
                    {communication.type === "email" ? t("email") : communication.type}
                  </Badge>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {directionLabel}
                  </span>
                </div>
                <h3 className="truncate text-sm font-black text-foreground/90">
                  {communication.subject || t("subjectFallback")}
                </h3>
                <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                  {communication.body || commonT("noData")}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 text-right space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground/80 bg-muted/50 px-2 py-1 rounded-md">
                {formatDistanceToNow(new Date(communication.sentAt), {
                  locale: es,
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
