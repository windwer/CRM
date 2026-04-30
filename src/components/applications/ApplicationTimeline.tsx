"use client";

import React from "react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { Mail, ArrowRightLeft, User, Brain } from "lucide-react";
import { useTranslations } from "next-intl";

interface ApplicationTimelineProps {
  communications: any[];
  statusHistory: any[];
  aiLogs: any[];
}

export function ApplicationTimeline({
  communications = [],
  statusHistory = [],
  aiLogs = [],
}: ApplicationTimelineProps) {
  const t = useTranslations("applications.timeline");
  const statusT = useTranslations("applications.status");

  const events = [
    ...communications.map((communication) => ({
      id: communication.id,
      type: "communication",
      date: new Date(communication.sentAt),
      title: communication.isOutbound
        ? `${t("emailSent")}: ${communication.subject}`
        : `${t("emailReceived")}: ${communication.subject}`,
      description: communication.body,
      icon: Mail,
      color: communication.isOutbound ? "bg-blue-500" : "bg-indigo-500",
      user: communication.sender?.name || communication.emailFrom,
    })),
    ...statusHistory.map((status) => ({
      id: status.id,
      type: "status_change",
      date: new Date(status.changedAt),
      title: t("statusChanged", { status: statusT(status.newStatus) }),
      description:
        status.reason ||
        t("statusChanged", {
          status: status.oldStatus ? statusT(status.oldStatus) : "",
        }),
      icon: ArrowRightLeft,
      color: "bg-slate-700",
      user: status.author?.name,
    })),
    ...aiLogs
      .filter((log) => log.status === "success")
      .map((log) => ({
        id: log.id,
        type: "ai_event",
        date: new Date(log.createdAt),
        title: log.processingType === "cv_parsing" ? t("cvParsed") : t("aiScored"),
        description: `${t("aiScored")} (${log.modelUsed})`,
        icon: Brain,
        color: "bg-purple-500",
        user: "Claude",
      })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (events.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed rounded-2xl bg-muted/20">
        <p className="text-muted-foreground font-medium italic">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-muted-foreground/10" />

      {events.map((event) => (
        <div key={`${event.type}-${event.id}`} className="relative pl-12 group">
          <div
            className={`absolute left-0 top-0 h-10 w-10 rounded-xl ${event.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10`}
          >
            <event.icon className="h-5 w-5" />
          </div>

          <div className="bg-background border border-muted/50 p-4 rounded-2xl hover:border-primary/30 transition-colors shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h4 className="text-sm font-black tracking-tight">{event.title}</h4>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                {formatDistanceToNow(event.date, { locale: es, addSuffix: true })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 italic mb-3">
              &quot;{event.description}&quot;
            </p>
            <div className="flex items-center gap-2 pt-3 border-t border-muted/30">
              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="text-[10px] font-black uppercase text-foreground/70">
                {event.user}
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {format(event.date, "dd/MM/yyyy HH:mm", { locale: es })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
