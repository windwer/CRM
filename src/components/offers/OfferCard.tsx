import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Building2, 
  Users, 
  Clock, 
  MoreHorizontal,
  ChevronRight,
  Briefcase
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslations } from "next-intl";

interface OfferCardProps {
  offer: any;
}

export function OfferCard({ offer }: OfferCardProps) {
  const router = useRouter();
  const t = useTranslations("offers");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "paused": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "closed": return "bg-slate-500/10 text-slate-600 border-slate-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card 
      className="group hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden border-muted/50"
      onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
    >
      <CardHeader className="pb-3 space-y-4">
        <div className="flex items-start justify-between">
          <div className="bg-primary/5 p-2 rounded-xl group-hover:bg-primary/10 transition-colors">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <Badge className={`capitalize font-medium border ${getStatusColor(offer.status)}`} variant="secondary">
            {t(`status.${offer.status}`)}
          </Badge>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl font-black group-hover:text-primary transition-colors">
            {offer.title}
          </CardTitle>
          <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <Building2 size={14} className="text-primary/60" />
              {offer.department}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-primary/60" />
              {offer.location}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-muted/50 text-[10px] uppercase tracking-wider font-bold">
            {t(`jobType.${offer.jobType || "full_time"}`)}
          </Badge>
          {offer.salaryMin && (
            <Badge variant="outline" className="text-[10px] font-bold">
              ${(offer.salaryMin / 1000).toFixed(0)}k - ${(offer.salaryMax / 1000).toFixed(0)}k
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Users size={14} className="text-primary" />
            <span>{offer.applicationsCount || 0} {t("stats.candidates")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={14} />
            <span>{formatDistanceToNow(new Date(offer.createdAt), { locale: es, addSuffix: true })}</span>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
          <ChevronRight size={18} />
        </Button>
      </CardFooter>
    </Card>
  );
}
