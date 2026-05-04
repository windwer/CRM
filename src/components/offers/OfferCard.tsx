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
  Briefcase,
  CheckCircle,
  RefreshCw,
  Pause,
  Upload,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslations } from "next-intl";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OfferCardProps {
  offer: any;
}

export function OfferCard({ offer }: OfferCardProps) {
  const router = useRouter();
  const t = useTranslations("offers");
  const queryClient = useQueryClient();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "paused": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "closed_hired": return "bg-slate-900 text-white border-slate-900";
      case "closed_no_hire": return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const changeStatus = async (status: string) => {
    try {
      await axios.patch(`/api/offers/${offer.id}/status`, { status });
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Estado actualizado" });
    } catch (error: any) {
      toast({
        title: "No se pudo actualizar",
        description: error.response?.data?.error?.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card 
      className="group hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden border-muted/50"
      onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
    >
      <CardHeader className="pb-3 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="bg-primary/5 p-2 rounded-xl group-hover:bg-primary/10 transition-colors">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col items-end gap-2">
            {offer.isUrgent && (
              <Badge variant="destructive" className="font-black tracking-widest">
                URGENTE
              </Badge>
            )}
            <Badge className={`font-medium border ${getStatusColor(offer.status)}`} variant="secondary">
              {offer.status === "closed_hired" && <CheckCircle className="mr-1 h-3 w-3" />}
              {t(`status.${offer.status}`)}
            </Badge>
          </div>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl font-black group-hover:text-primary transition-colors">
            {offer.title}
          </CardTitle>
          {offer.company && (
            <p className="text-sm font-bold text-primary">@ {offer.company}</p>
          )}
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
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-muted/50 text-[10px] uppercase tracking-wider font-bold">
            {t(`jobType.${offer.jobType || "full_time"}`)}
          </Badge>
          {offer.positionType && (
            <Badge variant="outline" className="text-[10px] font-bold uppercase">
              {t(`positionTypes.${offer.positionType}`)}
            </Badge>
          )}
          {offer.salaryMin && (
            <Badge variant="outline" className="text-[10px] font-bold">
              ${(offer.salaryMin / 1000).toFixed(0)}k - ${(offer.salaryMax / 1000).toFixed(0)}k
            </Badge>
          )}
        </div>
        {offer.customTags?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {offer.customTags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                #{tag}
              </Badge>
            ))}
            {offer.customTags.length > 3 && (
              <Badge variant="outline" className="text-[10px]">
                +{offer.customTags.length - 3} mas
              </Badge>
            )}
          </div>
        ) : null}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
            <Button size="icon" variant="ghost" className="rounded-full">
              <MoreHorizontal size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
            {offer.allowedTransitions?.includes("published") && (
              <DropdownMenuItem onClick={() => changeStatus("published")}>
                <Upload className="mr-2 h-4 w-4" />
                {offer.status === "closed_no_hire" ? t("actions.reopen") : t("actions.publish")}
              </DropdownMenuItem>
            )}
            {offer.allowedTransitions?.includes("paused") && (
              <DropdownMenuItem onClick={() => changeStatus("paused")}>
                <Pause className="mr-2 h-4 w-4" />
                {t("actions.pause")}
              </DropdownMenuItem>
            )}
            {(offer.allowedTransitions?.includes("closed_hired") ||
              offer.allowedTransitions?.includes("closed_no_hire")) && (
              <DropdownMenuItem onClick={() => router.push(`/dashboard/offers/${offer.id}`)}>
                <XCircle className="mr-2 h-4 w-4" />
                {t("actions.close")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push(`/dashboard/offers/${offer.id}`)}>
              <ChevronRight className="mr-2 h-4 w-4" />
              {t("details")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
