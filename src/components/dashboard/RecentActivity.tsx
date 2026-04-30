import React from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Mail, 
  UserPlus, 
  RefreshCw, 
  CheckCircle2, 
  FileText 
} from "lucide-react";
import { useTranslations } from "next-intl";

interface RecentActivityProps {
  activities: any[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const t = useTranslations("dashboard.recentActivity");
  const timelineT = useTranslations("applications.timeline");
  const getIcon = (type: string) => {
    switch (type) {
      case "email_sent": return { icon: Mail, color: "bg-blue-500", text: timelineT("emailSent") };
      case "email_received": return { icon: Mail, color: "bg-indigo-500", text: timelineT("emailReceived") };
      case "application_created": return { icon: UserPlus, color: "bg-emerald-500", text: "Nueva solicitud para" };
      case "cv_parsed": return { icon: FileText, color: "bg-purple-500", text: timelineT("cvParsed") };
      default: return { icon: RefreshCw, color: "bg-slate-500", text: "Actividad para" };
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground italic text-sm">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activities.map((activity, i) => {
        const config = getIcon(activity.type);
        return (
          <div key={i} className="flex gap-4 group">
            <div className="relative">
              <div className={`p-2 rounded-full ${config.color} text-white z-10 relative shadow-lg group-hover:scale-110 transition-transform`}>
                <config.icon className="h-3 w-3" />
              </div>
              {i < activities.length - 1 && (
                <div className="absolute top-8 bottom-[-24px] left-1/2 w-0.5 bg-muted-foreground/10" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className="text-sm leading-tight">
                <span className="font-bold">{config.text} {activity.candidate_name}</span>
                <span className="text-muted-foreground"> — {activity.offer_title}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activity.description}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-2">
                {formatDistanceToNow(new Date(activity.created_at), { locale: es, addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
