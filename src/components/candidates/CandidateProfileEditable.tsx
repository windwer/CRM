"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ExternalLink, Pencil, Save, X } from "lucide-react";
import type { z } from "zod";
import { candidateUpdateSchema, TALENT_POOL_STATUSES } from "@/lib/validations/candidate";
import { useUpdateCandidate, useUpdateTalentPool } from "@/hooks/useCandidates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const SENIORITIES = ["junior", "mid", "senior", "lead"] as const;

type CandidateUpdateInput = z.input<typeof candidateUpdateSchema>;

type EditableCandidate = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  linkedinUrl?: string | null;
  experienceYears?: number | null;
  seniorityLevel?: (typeof SENIORITIES)[number] | null;
  skillsArray?: string[] | null;
  consentPersonalData?: boolean | null;
  consentDate?: string | Date | null;
  anonymizedAt?: string | Date | null;
  salaryExpectationMax?: number | null;
  talentPoolStatus?: string | null;
};

type Props = {
  candidate: EditableCandidate;
  onEditingChange?: (editing: boolean) => void;
};

function buildDefaultValues(candidate: EditableCandidate): CandidateUpdateInput {
  return {
    email: candidate.email,
    fullName: candidate.fullName,
    phone: candidate.phone ?? "",
    linkedinUrl: candidate.linkedinUrl ?? "",
    experienceYears: candidate.experienceYears ?? 0,
    seniorityLevel: candidate.seniorityLevel ?? "mid",
    skillsArray: candidate.skillsArray ?? [],
    salaryExpectationMax: candidate.salaryExpectationMax ?? 0,
  };
}

const TALENT_POOL_LABELS: Record<string, string> = {
  active: "Activo",
  may_fit_future: "Encaja a futuro",
  discarded: "Descartado",
};

export function CandidateProfileEditable({ candidate, onEditingChange }: Props) {
  const [editing, setEditingState] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [talentPoolStatus, setTalentPoolStatus] = useState(
    candidate.talentPoolStatus ?? "active"
  );
  const [savingTalentPool, setSavingTalentPool] = useState(false);
  const updateCandidate = useUpdateCandidate(candidate.id);
  const updateTalentPool = useUpdateTalentPool(candidate.id);
  const { toast } = useToast();

  const defaultValues = useMemo(() => buildDefaultValues(candidate), [candidate]);

  const form = useForm<CandidateUpdateInput>({
    resolver: zodResolver(candidateUpdateSchema) as any,
    mode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    if (!editing) {
      form.reset(defaultValues);
    }
  }, [defaultValues, editing, form]);

  const skills = form.watch("skillsArray") ?? [];

  const setEditing = (nextEditing: boolean) => {
    setEditingState(nextEditing);
    onEditingChange?.(nextEditing);
  };

  const handleSave = form.handleSubmit(async (values) => {
    try {
      await updateCandidate.mutateAsync(candidateUpdateSchema.parse(values));
      toast({ title: "Candidato actualizado" });
      setEditing(false);
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.error?.message ?? error?.message;

      if (status === 409) {
        form.setError("email", {
          type: "manual",
          message: message ?? "Email ya existe",
        });
        toast({
          title: "Email duplicado",
          description: message ?? "Ya existe un candidato con ese email",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Error al actualizar",
        description: message ?? "Intentalo de nuevo",
        variant: "destructive",
      });
    }
  });

  const handleCancel = () => {
    form.reset(defaultValues);
    setSkillInput("");
    setEditing(false);
  };

  const handleTalentPoolChange = async (newStatus: string) => {
    setSavingTalentPool(true);
    try {
      await updateTalentPool.mutateAsync(newStatus);
      setTalentPoolStatus(newStatus);
      toast({ title: `Estado actualizado a "${TALENT_POOL_LABELS[newStatus] ?? newStatus}"` });
    } catch (error: any) {
      toast({
        title: "Error al actualizar estado",
        description: error?.response?.data?.error?.message ?? "Intentalo de nuevo",
        variant: "destructive",
      });
    } finally {
      setSavingTalentPool(false);
    }
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (!skill) return;

    if (skill.length > 50) {
      toast({ title: "Skill demasiado largo (max 50)", variant: "destructive" });
      return;
    }

    if (skills.length >= 50) {
      toast({ title: "Maximo 50 skills", variant: "destructive" });
      return;
    }

    if (skills.includes(skill)) return;

    form.setValue("skillsArray", [...skills, skill], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    form.setValue(
      "skillsArray",
      skills.filter((item) => item !== skill),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  return (
    <div
      className={`space-y-6 rounded-3xl border bg-card p-8 shadow-sm ${
        editing ? "border-2 border-primary/40 bg-primary/5" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              {...form.register("fullName")}
              className="h-auto text-2xl font-bold"
              placeholder="Nombre completo"
            />
          ) : (
            <h2 className="text-2xl font-black tracking-tight">{candidate.fullName}</h2>
          )}
          {form.formState.errors.fullName && (
            <p className="mt-1 text-sm text-destructive">
              {form.formState.errors.fullName.message}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {!editing ? (
            <Button onClick={() => setEditing(true)} variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="sm"
                disabled={updateCandidate.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                disabled={!form.formState.isValid || updateCandidate.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateCandidate.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="flex items-start gap-2 rounded-md bg-muted/60 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            El consentimiento GDPR y los datos parseados del CV no se editan desde aqui.
            Para gestion GDPR, contacta con un admin.
          </span>
        </div>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">Contacto</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Email" error={form.formState.errors.email?.message}>
            {editing ? (
              <Input type="email" {...form.register("email")} />
            ) : (
              <p className="text-sm">{candidate.email}</p>
            )}
          </Field>

          <Field label="Telefono" error={form.formState.errors.phone?.message}>
            {editing ? (
              <Input {...form.register("phone")} placeholder="+34 ..." />
            ) : (
              <p className="text-sm">{candidate.phone || "-"}</p>
            )}
          </Field>

          <Field label="LinkedIn" error={form.formState.errors.linkedinUrl?.message}>
            {editing ? (
              <Input {...form.register("linkedinUrl")} placeholder="https://..." />
            ) : candidate.linkedinUrl ? (
              <a
                href={candidate.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {candidate.linkedinUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="text-sm">-</p>
            )}
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">
          Perfil profesional
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Anos de experiencia"
            error={form.formState.errors.experienceYears?.message}
          >
            {editing ? (
              <Input
                type="number"
                min={0}
                max={50}
                {...form.register("experienceYears", {
                  setValueAs: (value) => (value === "" ? 0 : Number(value)),
                })}
              />
            ) : (
              <p className="text-sm">{candidate.experienceYears ?? 0} anos</p>
            )}
          </Field>

          <Field label="Seniority">
            {editing ? (
              <Controller
                control={form.control}
                name="seniorityLevel"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? "mid"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SENIORITIES.map((seniority) => (
                        <SelectItem key={seniority} value={seniority}>
                          {seniority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <p className="text-sm capitalize">{candidate.seniorityLevel || "-"}</p>
            )}
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="gap-1">
              {skill}
              {editing && (
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  aria-label={`Quitar ${skill}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {!editing && skills.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin skills registrados</p>
          )}
        </div>

        {editing && (
          <>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Anadir skill y pulsar Enter"
                maxLength={50}
              />
              <Button type="button" onClick={addSkill} variant="outline">
                Anadir
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {skills.length}/50 skills - max 50 caracteres cada uno
            </p>
          </>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">
          Pretensión salarial
        </h3>
        <Field
          label="Salario máximo deseado (EUR/año bruto)"
          error={form.formState.errors.salaryExpectationMax?.message}
        >
          {editing ? (
            <Input
              type="number"
              min={0}
              max={999999}
              placeholder="Ej: 55000"
              {...form.register("salaryExpectationMax", {
                setValueAs: (value) => (value === "" ? 0 : Number(value)),
              })}
            />
          ) : (
            <p className="text-sm">
              {!candidate.salaryExpectationMax || candidate.salaryExpectationMax === 0 ? (
                <span className="italic text-muted-foreground">Sin definir</span>
              ) : (
                `${candidate.salaryExpectationMax.toLocaleString("es-ES")} EUR/año`
              )}
            </p>
          )}
        </Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">
          Pool de talento
        </h3>
        <div className="flex items-center gap-4">
          <Select
            value={talentPoolStatus}
            onValueChange={handleTalentPoolChange}
            disabled={savingTalentPool}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TALENT_POOL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {TALENT_POOL_LABELS[s] ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {savingTalentPool && (
            <span className="text-xs text-muted-foreground">Guardando...</span>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">Estado GDPR</h3>
        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Consentimiento: </span>
            <span>
              {candidate.consentPersonalData ? "Si" : "No"}
              {candidate.consentDate &&
                ` (${new Date(candidate.consentDate).toLocaleDateString("es-ES")})`}
            </span>
          </div>
          {candidate.anonymizedAt && (
            <div className="text-amber-700">
              Anonimizado el {new Date(candidate.anonymizedAt).toLocaleDateString("es-ES")}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
