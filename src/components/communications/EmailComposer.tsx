"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, X } from "lucide-react";
import { useCommunications } from "@/hooks/useCommunications";
import { EmailTemplateSelector } from "./EmailTemplateSelector";
import { useTranslations } from "next-intl";

interface EmailComposerProps {
  applicationId: string;
  candidate: {
    fullName: string;
    email: string;
  };
  offerTitle: string;
  recruiterName: string;
  onClose?: () => void;
}

export function EmailComposer({ 
  applicationId, 
  candidate, 
  offerTitle, 
  recruiterName,
  onClose 
}: EmailComposerProps) {
  const { templates, sendEmail, isSending } = useCommunications({ applicationId });
  const t = useTranslations("email");
  const commonT = useTranslations("common");
  
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [cc, setCc] = useState("");

  const replaceVariables = (text: string) => {
    return text
      .replace(/{{candidate_name}}/g, candidate.fullName)
      .replace(/{{offer_title}}/g, offerTitle)
      .replace(/{{recruiter_name}}/g, recruiterName);
  };

  const handleTemplateSelect = (template: any) => {
    if (template) {
      setSubject(replaceVariables(template.subject || ""));
      setBody(replaceVariables(template.body || ""));
    } else {
      setSubject("");
      setBody("");
    }
  };

  const handleSend = async () => {
    await sendEmail({
      application_id: applicationId,
      to: candidate.email,
      subject,
      body,
      cc: cc ? cc.split(",").map(e => e.trim()) : [],
    });
    onClose?.();
  };

  return (
    <Card className="shadow-2xl border-primary/20 overflow-hidden bg-background">
      <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            {t("compose")}
          </CardTitle>
          <EmailTemplateSelector templates={templates || []} onSelect={handleTemplateSelect} />
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-[80px_1fr] items-center gap-4 text-sm">
          <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("to")}</span>
          <Input value={candidate.email} readOnly className="bg-muted/50 border-none h-8 font-medium" />
          
          <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">CC</span>
          <Input 
            placeholder="cc@empresa.com" 
            value={cc} 
            onChange={(e) => setCc(e.target.value)}
            className="border-none bg-muted/20 h-8 focus-visible:ring-1"
          />

          <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">{t("subject")}</span>
          <Input 
            placeholder={t("subject")} 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            className="font-bold border-none bg-muted/20 h-10 text-lg focus-visible:ring-1"
          />
        </div>

        <div className="pt-2">
          <Textarea 
            placeholder={t("body")} 
            className="min-h-[250px] resize-none border-none bg-muted/10 p-4 focus-visible:ring-1 leading-relaxed"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 p-4 flex justify-between items-center">
        <p className="text-[10px] text-muted-foreground italic">
          {t("templates.variables")}: {"{{candidate_name}}"}
        </p>
        <div className="flex gap-2">
          {onClose && <Button variant="outline" onClick={onClose}>{commonT("cancel")}</Button>}
          <Button 
            disabled={isSending || !subject || !body} 
            onClick={handleSend}
            className="px-8 shadow-lg shadow-primary/20"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {commonT("loading")}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t("send")}
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
