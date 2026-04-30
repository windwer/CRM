"use client";

import React, { useState } from "react";
import { useApplication } from "@/hooks/useApplications";
import { StatusStepper } from "@/components/applications/StatusStepper";
import { ApplicationTimeline } from "@/components/applications/ApplicationTimeline";
import { ApplicationCard } from "@/components/applications/ApplicationCard";
import { EmailComposer } from "@/components/communications/EmailComposer";
import { AIScoreCard } from "@/components/candidates/AIScoreCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  History, 
  MessageSquare, 
  Brain, 
  Mail, 
  Save, 
  ArrowLeft 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const { 
    application, 
    isLoading, 
    updateStatus, 
    isUpdatingStatus,
    updateNotes 
  } = useApplication(params.id);
  
  const [notes, setNotes] = useState(application?.internalNotes || "");
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const router = useRouter();
  const t = useTranslations("applications");
  const emailT = useTranslations("email");
  const commonT = useTranslations("common");

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <Skeleton className="h-[600px] lg:col-span-3 rounded-2xl" />
          <Skeleton className="h-[600px] lg:col-span-2 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!application) {
    return <div className="p-12 text-center font-black">{commonT("noData")}</div>;
  }

  const handleStatusChange = async (newStatus: string) => {
    await updateStatus(newStatus);
  };

  const handleSaveNotes = async () => {
    await updateNotes(notes);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight">{application.candidate.fullName}</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 capitalize px-3">
              {application.offer.title}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground font-medium">{t("status.applied")} {new Intl.DateTimeFormat("es-ES").format(new Date(application.createdAt))}</p>
        </div>
      </div>

      <div className="bg-background border border-muted/50 rounded-3xl p-8 shadow-sm">
        <StatusStepper 
          currentStatus={application.status} 
          onStatusChange={handleStatusChange}
          isUpdating={isUpdatingStatus}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Timeline & Interaction */}
        <div className="lg:col-span-3 space-y-8">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <History className="h-4 w-4" />
                {t("detail.timeline")}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-primary/20 text-primary hover:bg-primary/5"
                onClick={() => setShowEmailComposer(!showEmailComposer)}
              >
                <Mail className="mr-2 h-4 w-4" />
                {showEmailComposer ? commonT("cancel") : t("detail.sendEmail")}
              </Button>
            </CardHeader>
            <CardContent>
              {showEmailComposer && (
                <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
                  <EmailComposer 
                    applicationId={application.id}
                    candidate={application.candidate}
                    offerTitle={application.offer.title}
                    recruiterName="Usuario actual"
                    onClose={() => setShowEmailComposer(false)}
                  />
                </div>
              )}
              <ApplicationTimeline 
                communications={application.communications}
                statusHistory={application.statusHistory}
                aiLogs={application.aiProcessingLogs}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Candidate Info & Notes */}
        <div className="lg:col-span-2 space-y-8">
          <ApplicationCard candidate={application.candidate} />
          
          <AIScoreCard 
            applicationId={application.id}
            candidateId={application.candidateId}
            offerId={application.offerId}
            score={application.aiScore ? Number(application.aiScore) : undefined}
            explanation={application.aiExplanation}
            aiScoreDetails={application.aiScoreDetails}
          />

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t("detail.internalNotes")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Textarea 
                placeholder={t("detail.internalNotes")} 
                className="min-h-[200px] resize-none border-none bg-muted/10 focus-visible:ring-1"
                defaultValue={application.internalNotes || ""}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button className="w-full font-bold" onClick={handleSaveNotes}>
                <Save className="mr-2 h-4 w-4" />
                {t("detail.saveNote")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
