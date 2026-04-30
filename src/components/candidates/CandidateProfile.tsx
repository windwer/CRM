import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Phone, 
  Link, 
  Calendar, 
  Trash2, 
  ShieldCheck,
  User,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslations } from "next-intl";

interface CandidateProfileProps {
  candidate: any;
}

export function CandidateProfile({ candidate }: CandidateProfileProps) {
  const t = useTranslations("candidates");
  const commonT = useTranslations("common");

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex gap-5">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
            <User className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight">{candidate.fullName}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail size={14} className="text-primary" />
                {candidate.email}
              </span>
              {candidate.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-primary" />
                  {candidate.phone}
                </span>
              )}
              {candidate.linkedinUrl && (
                <a 
                  href={candidate.linkedinUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  <Link size={14} />
                  {t("detail.linkedIn")}
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Badge variant="outline" className="capitalize">{t(`form.sources.${candidate.source || "manual"}`)}</Badge>
              <Badge className="bg-indigo-500 hover:bg-indigo-600 capitalize">
                {t(`search.seniorityOptions.${candidate.seniorityLevel || "mid"}`)}
              </Badge>
              <Badge variant="secondary">{t("yearsShort", { years: candidate.experienceYears || 0 })}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">{t("detail.editProfile")}</Button>
          <Button variant="destructive" size="sm" className="bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20">
            <Trash2 className="mr-2 h-4 w-4" />
            {t("archive")}
          </Button>
        </div>
      </div>

      {/* Skills Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("table.skills")}</h3>
        <div className="flex flex-wrap gap-2">
          {candidate.skillsArray?.map((skill: string) => (
            <Badge key={skill} variant="secondary" className="px-3 py-1 font-medium bg-background border shadow-sm">
              {skill}
            </Badge>
          ))}
          {(!candidate.skillsArray || candidate.skillsArray.length === 0) && (
            <span className="text-sm text-muted-foreground italic">{commonT("noData")}</span>
          )}
        </div>
      </div>

      {/* GDPR Compliance Box */}
      <div className="p-4 rounded-xl bg-muted/50 border border-primary/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold">GDPR</p>
            <p className="text-xs text-muted-foreground">
              {candidate.createdAt ? t("detail.gdprConsent", { date: format(new Date(candidate.createdAt), "dd/MM/yyyy", { locale: es }) }) : commonT("noData")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">GDPR</p>
          <p className="text-xs font-mono font-medium text-amber-600">
            {candidate.createdAt ? t("detail.gdprDeletion", { date: format(new Date(new Date(candidate.createdAt).setFullYear(new Date(candidate.createdAt).getFullYear() + 2)), "dd/MM/yyyy", { locale: es }) }) : commonT("noData")}
          </p>
        </div>
      </div>
    </div>
  );
}
