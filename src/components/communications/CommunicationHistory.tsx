"use client";

import React, { useState } from "react";
import { useCommunications } from "@/hooks/useCommunications";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Mail, 
  Phone, 
  Users, 
  StickyNote, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight, 
  ArrowDownLeft 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface CommunicationHistoryProps {
  applicationId: string;
  candidateId: string;
}

export function CommunicationHistory({ applicationId, candidateId }: CommunicationHistoryProps) {
  const { communications, isLoading } = useCommunications({ applicationId, candidateId });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!communications || communications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-2xl bg-muted/20">
        <Mail className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <h3 className="font-bold text-muted-foreground">No communications yet</h3>
        <p className="text-xs text-muted-foreground/60">Outbound and inbound emails will appear here.</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />;
      case "call": return <Phone className="h-4 w-4" />;
      case "meeting": return <Users className="h-4 w-4" />;
      default: return <StickyNote className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4 relative">
      {/* Vertical Timeline Line */}
      <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-muted-foreground/10 hidden md:block" />

      {communications.map((comm: any) => (
        <div key={comm.id} className="relative pl-0 md:pl-10">
          {/* Timeline Dot */}
          <div className={`
            absolute left-[10px] top-4 h-5 w-5 rounded-full border-4 border-background z-10 hidden md:flex items-center justify-center
            ${comm.isOutbound ? "bg-primary" : "bg-indigo-500"}
          `} />

          <div 
            className={`
              p-4 rounded-2xl border transition-all cursor-pointer group hover:shadow-md
              ${expandedId === comm.id ? "bg-muted/30 border-primary/20" : "bg-background border-muted/50 hover:border-primary/30"}
            `}
            onClick={() => setExpandedId(expandedId === comm.id ? null : comm.id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${comm.isOutbound ? "bg-primary/10 text-primary" : "bg-indigo-500/10 text-indigo-600"}`}>
                  {getIcon(comm.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black">{comm.subject || "No Subject"}</h4>
                    <Badge variant={comm.isOutbound ? "outline" : "secondary"} className="text-[9px] uppercase tracking-tighter h-4 px-1.5 font-bold">
                      {comm.isOutbound ? (
                        <>
                          <ArrowUpRight className="h-2 w-2 mr-1" />
                          Sent
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="h-2 w-2 mr-1" />
                          Received
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {comm.isOutbound ? "Sent by " : "Received from "} 
                    <span className="font-bold text-foreground/80">{comm.sender?.name || comm.emailFrom}</span>
                    <span className="mx-1.5">•</span>
                    {format(new Date(comm.sentAt), "MMM d, h:mm a")} ({formatDistanceToNow(new Date(comm.sentAt), { addSuffix: true })})
                  </p>
                </div>
              </div>
              {expandedId === comm.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>

            {expandedId === comm.id ? (
              <div className="mt-4 pt-4 border-t border-muted-foreground/10 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-medium font-sans">
                  {comm.body}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-1 pl-11">
                {comm.body}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
