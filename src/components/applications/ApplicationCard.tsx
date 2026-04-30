"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Phone, 
  ExternalLink, 
  Download, 
  User, 
  MapPin,
  Link as LinkIcon,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface ApplicationCardProps {
  candidate: any;
}

export function ApplicationCard({ candidate }: ApplicationCardProps) {
  const t = useTranslations("candidates");
  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">{candidate.fullName}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-background/50">
                  {t(`search.seniorityOptions.${candidate.seniorityLevel || "mid"}`)}
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {t("yearsShort", { years: candidate.experienceYears || 0 })}
                </Badge>
              </div>
            </div>
          </div>
          <Button asChild size="icon" variant="ghost" className="rounded-full">
            <Link href={`/dashboard/candidates/${candidate.id}`}>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm font-medium">
            <Mail className="h-4 w-4 text-primary/60" />
            {candidate.email}
          </div>
          {candidate.phone && (
            <div className="flex items-center gap-3 text-sm font-medium">
              <Phone className="h-4 w-4 text-primary/60" />
              {candidate.phone}
            </div>
          )}
          {candidate.linkedinUrl && (
            <a 
              href={candidate.linkedinUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-3 text-sm font-medium text-blue-600 hover:underline"
            >
              <LinkIcon className="h-4 w-4" />
              {t("detail.linkedIn")}
            </a>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-primary/10">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t("table.skills")}</h4>
          <div className="flex flex-wrap gap-1.5">
            {candidate.skillsArray?.slice(0, 5).map((skill: string) => (
              <Badge key={skill} variant="secondary" className="bg-background border shadow-sm text-[10px] font-bold">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {candidate.cvBlobId && (
          <Button className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold" variant="default">
            <Download className="mr-2 h-4 w-4" />
            {t("detail.downloadCv")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
