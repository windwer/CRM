"use client";

import React, { useState } from "react";
import { useCandidate } from "@/hooks/useCandidate";
import { CandidateProfileEditable } from "@/components/candidates/CandidateProfileEditable";
import { CVUploader } from "@/components/candidates/CVUploader";
import { CVParsedData } from "@/components/candidates/CVParsedData";
import { AIScoreCard } from "@/components/candidates/AIScoreCard";
import { CandidateApplicationsTab } from "@/components/candidates/CandidateApplicationsTab";
import { CandidateCommunicationsTab } from "@/components/candidates/CandidateCommunicationsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Mail, 
  Briefcase, 
  LayoutDashboard,
  ArrowLeft,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function CandidateDetailPage({ params }: { params: { id: string } }) {
  const { data: candidate, isLoading } = useCandidate(params.id);
  const [isEditing, setIsEditing] = useState(false);
  const t = useTranslations("candidates");
  const commonT = useTranslations("common");

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">{commonT("noData")}</h1>
        <Link href="/dashboard/candidates">
          <Button variant="outline">{commonT("back")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Breadcrumbs / Back */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/candidates">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="text-sm text-muted-foreground">
          {t("title")} / <span className="text-foreground font-medium">{candidate.fullName}</span>
        </div>
      </div>

      <CandidateProfileEditable candidate={candidate} onEditingChange={setIsEditing} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-6">
          <TabsTrigger value="overview" className="flex gap-2">
            <LayoutDashboard size={14} /> {t("detail.profile")}
          </TabsTrigger>
          <TabsTrigger value="cv" className="flex gap-2">
            <FileText size={14} /> {t("cv.parsed")}
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex gap-2">
            <Briefcase size={14} /> {t("detail.applications")}
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex gap-2">
            <Mail size={14} /> {t("detail.communications")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-0">
          <div className="lg:col-span-2 space-y-8">
            <CVParsedData data={candidate.parsedData} />
          </div>
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">{t("aiScore.title")}</h3>
            {candidate.applications?.length > 0 ? (
              candidate.applications.map((app: any) => (
                <AIScoreCard 
                  key={app.id}
                  applicationId={app.id}
                  candidateId={candidate.id}
                  offerId={app.offerId}
                  score={app.aiScore ? Number(app.aiScore) : undefined}
                  explanation={app.aiExplanation}
                  aiScoreDetails={app.aiScoreDetails}
                />
              ))
            ) : (
              <div className="p-8 rounded-xl bg-muted/30 border-2 border-dashed text-center">
                <p className="text-sm text-muted-foreground italic">
                  {t("detail.noApplications")}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cv" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">{t("cv.upload")}</h3>
              <CVUploader candidateId={candidate.id} />
              {isEditing && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Guarda o cancela la edicion del perfil antes de cambiar otros datos.
                </p>
              )}
            </div>
            <div className="bg-muted/20 rounded-xl p-8 border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="text-sm italic">{t("cv.uploadHint")}</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="applications">
          <CandidateApplicationsTab candidateId={candidate.id} />
        </TabsContent>
        
        <TabsContent value="communications">
          <CandidateCommunicationsTab candidateId={candidate.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
