"use client";

import React, { Suspense, useMemo, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText, Loader2, UserPlus } from "lucide-react";
import { useOffers } from "@/hooks/useOffers";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

function NewCandidateWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedOfferId = searchParams.get("offerId") || "";
  const t = useTranslations("candidates");
  const commonT = useTranslations("common");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const { data: offersResponse } = useOffers();
  const { data: stages = [] } = usePipelineStages();
  const { data: users = [] } = useUsers();
  const offers = useMemo(() => offersResponse?.data || [], [offersResponse?.data]);
  const defaultStage = stages[0]?.id || "";
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    linkedinUrl: "",
    consentPersonalData: false,
    offerId: preselectedOfferId,
    assignedToId: "unassigned",
    pipelineStageId: "",
    candidateNotes: "",
  });

  const selectedOffer = useMemo(
    () => offers.find((offer: any) => offer.id === form.offerId),
    [offers, form.offerId]
  );
  const selectedStageId = form.pipelineStageId || defaultStage;
  const selectedStage = stages.find((stage: any) => stage.id === selectedStageId);
  const selectedUser = users.find((user: any) => user.id === form.assignedToId);

  const update = (key: string, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const canContinueStep1 =
    form.fullName.trim().length >= 2 && form.email.includes("@") && form.consentPersonalData;
  const canConfirm = canContinueStep1 && form.offerId && selectedStageId;

  const handleSubmit = async () => {
    if (!canConfirm) return;
    setIsSubmitting(true);
    try {
      const candidateResponse = await axios.post("/api/candidates", {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        linkedinUrl: form.linkedinUrl.trim().startsWith("http")
          ? form.linkedinUrl.trim()
          : undefined,
        consentPersonalData: form.consentPersonalData,
        experienceYears: 0,
        seniorityLevel: "mid",
        skillsArray: [],
      });
      const candidate = candidateResponse.data.data;

      const applicationResponse = await axios.post(`/api/offers/${form.offerId}/apply`, {
        candidateId: candidate.id,
        assignedToId: form.assignedToId === "unassigned" ? undefined : form.assignedToId,
        candidateNotes: form.candidateNotes || undefined,
        pipelineStageId: selectedStageId,
      });
      const application = applicationResponse.data.data;

      if (cvFile) {
        const formData = new FormData();
        formData.append("file", cvFile);
        try {
          await axios.post(`/api/candidates/${candidate.id}/upload-cv`, formData);
        } catch (uploadError: any) {
          toast({
            title: "Candidato vinculado; CV pendiente",
            description:
              uploadError.response?.data?.error?.message ||
              "No se pudo subir el CV, pero la candidatura ya esta creada.",
            variant: "destructive",
          });
        }
      }

      toast({ title: "Candidato creado y vinculado correctamente" });
      router.push(`/dashboard/applications/${application.id}`);
    } catch (error: any) {
      toast({
        title: commonT("error"),
        description: error.response?.data?.error?.message || "No se pudo completar el alta",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black">{t("newCandidate")}</h1>
          <p className="text-sm text-muted-foreground">Alta guiada para demo local</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[t("wizard.step1"), t("wizard.step2"), t("wizard.step3")].map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index + 1)}
            className={`rounded-xl border p-4 text-left text-sm font-bold ${
              step === index + 1 ? "border-primary bg-primary/5 text-primary" : "bg-background"
            }`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("wizard.step1")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input value={form.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} />
            </div>
            <label className="flex items-center gap-3 rounded-xl border p-4 md:col-span-2">
              <input
                type="checkbox"
                checked={form.consentPersonalData}
                onChange={(e) => update("consentPersonalData", e.target.checked)}
                className="h-5 w-5 accent-primary"
              />
              <span className="text-sm font-bold">Consentimiento GDPR recibido</span>
            </label>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("wizard.step2")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-2 md:col-span-3">
                <Label>{t("wizard.linkedOffer")}</Label>
                <Select value={form.offerId} onValueChange={(value) => update("offerId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("wizard.selectOffer")} />
                  </SelectTrigger>
                  <SelectContent>
                    {offers.map((offer: any) => (
                      <SelectItem key={offer.id} value={offer.id}>
                        {offer.title}{offer.company ? ` @ ${offer.company}` : ""} · {offer.status}{offer.isUrgent ? " - URGENTE" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("wizard.assignedTo")}</Label>
                <Select value={form.assignedToId} onValueChange={(value) => update("assignedToId", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">{t("wizard.unassigned")}</SelectItem>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("wizard.initialStage")}</Label>
                <Select value={selectedStageId} onValueChange={(value) => update("pipelineStageId", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage: any) => (
                      <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CV PDF</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setCvFile(event.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("wizard.candidateNotes")}</Label>
              <Textarea
                value={form.candidateNotes}
                maxLength={2000}
                placeholder={t("wizard.candidateNotesPlaceholder")}
                className="min-h-[160px]"
                onChange={(e) => update("candidateNotes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("wizard.summary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border p-5">
              <p className="text-xl font-black">{form.fullName}</p>
              <p className="text-sm text-muted-foreground">{form.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedOffer && <Badge>{selectedOffer.title}</Badge>}
              {selectedOffer?.isUrgent && <Badge variant="destructive">URGENTE</Badge>}
              {selectedStage && <Badge variant="secondary">{selectedStage.name}</Badge>}
              <Badge variant="outline">{selectedUser?.name || t("wizard.unassigned")}</Badge>
              {cvFile && <Badge variant="outline"><FileText className="mr-1 h-3 w-3" />{cvFile.name}</Badge>}
            </div>
            {form.candidateNotes && (
              <p className="whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm">{form.candidateNotes}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>{commonT("back")}</Button>}
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !canContinueStep1}>
            Siguiente
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canConfirm || isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {t("wizard.createAndLink")}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function NewCandidatePage() {
  return (
    <Suspense fallback={<div className="p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <NewCandidateWizard />
    </Suspense>
  );
}
