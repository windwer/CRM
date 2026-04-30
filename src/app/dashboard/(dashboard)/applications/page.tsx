"use client";

import React from "react";
import { useApplications } from "@/hooks/useApplications";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Star,
  Clock,
  User,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

export default function ApplicationsPage() {
  const { applications, isLoading } = useApplications();
  const t = useTranslations("applications");
  const commonT = useTranslations("common");

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "hired": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "rejected": return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      case "offer": return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "interview_1":
      case "interview_2":
      case "interview_3": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-emerald-600 font-black";
    if (score >= 0.6) return "text-amber-600 font-black";
    return "text-rose-600 font-black";
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground font-medium mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="rounded-xl"><Filter className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="rounded-xl"><Search className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="rounded-2xl border border-muted/50 overflow-hidden bg-background shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-muted/50">
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6">{t("table.candidate")}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">{t("table.offer")}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">{t("table.status")}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">{t("table.aiScore")}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">{t("table.lastContact")}</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">{t("table.recruiter")}</TableHead>
              <TableHead className="text-right px-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications?.map((app: any) => (
              <TableRow key={app.id} className="group hover:bg-muted/20 border-muted/50 transition-colors">
                <TableCell className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm group-hover:text-primary transition-colors">{app.candidate.fullName}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{app.candidate.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-semibold truncate max-w-[200px]">{app.offer.title}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={`capitalize font-bold text-[9px] tracking-widest border-2 ${getStatusColor(app.status)}`}>
                    {t(`status.${app.status}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {app.aiScore ? (
                    <div className="flex flex-col items-center">
                      <span className={`text-lg ${getScoreColor(Number(app.aiScore))}`}>
                        {Math.round(Number(app.aiScore) * 100)}%
                      </span>
                    </div>
                  ) : (
                    <Star className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {app.lastContactAt ? formatDistanceToNow(new Date(app.lastContactAt), { locale: es, addSuffix: true }) : commonT("never")}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <span className="text-[10px] font-black text-indigo-600">
                        {app.lastContacter?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-foreground/80">{app.lastContacter?.name || "Sistema"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right px-6">
                  <Button asChild size="icon" variant="ghost" className="rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                    <Link href={`/dashboard/applications/${app.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!applications || applications.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                  {commonT("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
