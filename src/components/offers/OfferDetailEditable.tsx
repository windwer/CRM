"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle, Pencil, Save, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import { offerUpdateSchema } from "@/lib/validations/offer";
import { useUpdateOffer } from "@/hooks/useOffers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const JOB_TYPES = ["full_time", "part_time", "contract", "internship"] as const;
const POSITION_TYPES = [
  "developer",
  "designer",
  "manager",
  "product",
  "marketing",
  "sales",
  "data",
  "devops",
  "qa",
  "other",
] as const;

type OfferUpdateInput = z.infer<typeof offerUpdateSchema>;

type EditableOffer = {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  createdAt: string | Date;
  closedAt?: string | Date | null;
  jobType?: (typeof JOB_TYPES)[number] | null;
  salaryMax?: number | string | null;
  company?: string | null;
  positionType?: (typeof POSITION_TYPES)[number] | null;
  isUrgent?: boolean | null;
  customTags?: string[] | null;
  mustHaves?: string | null;
  hiredApplication?: {
    candidate: {
      fullName: string;
      email: string;
    };
  } | null;
};

type Props = {
  offer: EditableOffer;
  onEditingChange?: (editing: boolean) => void;
};

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function buildDefaultValues(offer: EditableOffer): OfferUpdateInput {
  return {
    title: offer.title,
    description: offer.description,
    location: offer.location,
    jobType: offer.jobType ?? undefined,
    salaryMax: toOptionalNumber(offer.salaryMax),
    company: offer.company ?? "",
    positionType: offer.positionType ?? undefined,
    isUrgent: offer.isUrgent ?? false,
    customTags: offer.customTags ?? [],
    mustHaves: offer.mustHaves ?? "",
  };
}

function formatSalary(value: number | string | null | undefined) {
  const numberValue = toOptionalNumber(value);
  if (numberValue === undefined) return "-";
  return new Intl.NumberFormat("es-ES").format(numberValue);
}

export function OfferDetailEditable({ offer, onEditingChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const updateOffer = useUpdateOffer(offer.id);
  const t = useTranslations("offers");

  const defaultValues = useMemo(() => buildDefaultValues(offer), [offer]);

  const form = useForm<OfferUpdateInput>({
    resolver: zodResolver(offerUpdateSchema),
    mode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    if (!editing) {
      form.reset(defaultValues);
    }
  }, [defaultValues, editing, form]);

  const customTags = form.watch("customTags") ?? [];
  const mustHaves = form.watch("mustHaves") ?? "";

  const setEditingMode = (nextEditing: boolean) => {
    setEditing(nextEditing);
    onEditingChange?.(nextEditing);
  };

  const handleSave = form.handleSubmit(async (values) => {
    try {
      await updateOffer.mutateAsync(values);
      toast({ title: "Oferta actualizada" });
      setEditingMode(false);
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error?.response?.data?.error?.message ?? error?.message ?? "Intentalo de nuevo",
        variant: "destructive",
      });
    }
  });

  const handleCancel = () => {
    form.reset(defaultValues);
    setTagInput("");
    setEditingMode(false);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;

    if (tag.length > 30) {
      toast({ title: "Etiqueta demasiado larga (max 30)", variant: "destructive" });
      return;
    }

    if (customTags.length >= 10) {
      toast({ title: "Maximo 10 etiquetas", variant: "destructive" });
      return;
    }

    if (customTags.includes(tag)) return;

    form.setValue("customTags", [...customTags, tag], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    form.setValue(
      "customTags",
      customTags.filter((item) => item !== tag),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  return (
    <div
      className={`bg-card border rounded-3xl p-8 space-y-6 shadow-sm ${
        editing ? "border-2 border-primary/40 bg-primary/5" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          {offer.isUrgent && !editing && (
            <Badge variant="destructive" className="w-fit px-4 py-1 text-sm font-black tracking-widest">
              URGENTE
            </Badge>
          )}
          {editing ? (
            <Input
              {...form.register("title")}
              className="h-auto text-3xl font-black tracking-normal"
              placeholder="Titulo de la oferta"
            />
          ) : (
            <h1 className="text-4xl font-black tracking-normal">{offer.title}</h1>
          )}
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {!editing ? (
            <Button onClick={() => setEditingMode(true)} variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="sm"
                disabled={updateOffer.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                disabled={!form.formState.isValid || updateOffer.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateOffer.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="flex items-start gap-2 rounded-md bg-muted/60 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Las acciones de cambio de estado estan deshabilitadas mientras editas. Para
            cambiar el estado, guarda o cancela primero.
          </span>
        </div>
      )}

      {!editing && (
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="capitalize bg-emerald-500 hover:bg-emerald-600">
            {t(`status.${offer.status}`)}
          </Badge>
          <Badge variant="secondary" className="uppercase tracking-wider text-[10px] font-bold">
            {t(`jobType.${offer.jobType || "full_time"}`)}
          </Badge>
          {offer.positionType && (
            <Badge variant="outline" className="uppercase tracking-wider text-[10px] font-bold">
              {t(`positionTypes.${offer.positionType}`)}
            </Badge>
          )}
          {offer.salaryMax && (
            <Badge variant="outline" className="font-bold">
              hasta {formatSalary(offer.salaryMax)}
            </Badge>
          )}
        </div>
      )}

      {offer.status === "closed_hired" && !editing && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-black text-emerald-900">
            {t("closedHiredInfo", {
              date: offer.closedAt
                ? format(new Date(offer.closedAt), "dd/MM/yyyy", { locale: es })
                : "-",
            })}
          </p>
          {offer.hiredApplication && (
            <div className="mt-3 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-700" />
              <div>
                <p className="text-sm font-bold">{t("hiredCandidate")}</p>
                <p className="text-sm text-emerald-900">
                  {offer.hiredApplication.candidate.fullName} - {offer.hiredApplication.candidate.email}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {offer.status === "closed_no_hire" && !editing && (
        <div className="rounded-2xl border bg-muted/40 p-5">
          <p className="font-black">
            {t("closedNoHireInfo", {
              date: offer.closedAt
                ? format(new Date(offer.closedAt), "dd/MM/yyyy", { locale: es })
                : "-",
            })}
          </p>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Datos basicos</h2>

        <Field label="Descripcion" error={form.formState.errors.description?.message}>
          {editing ? (
            <Textarea {...form.register("description")} rows={5} />
          ) : (
            <p className="whitespace-pre-line text-sm text-muted-foreground">{offer.description}</p>
          )}
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Ubicacion" error={form.formState.errors.location?.message}>
            {editing ? <Input {...form.register("location")} /> : <p className="text-sm">{offer.location}</p>}
          </Field>

          <Field label="Tipo de jornada">
            {editing ? (
              <Controller
                control={form.control}
                name="jobType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((jobType) => (
                        <SelectItem key={jobType} value={jobType}>
                          {t(`jobType.${jobType}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <p className="text-sm">{offer.jobType ? t(`jobType.${offer.jobType}`) : "-"}</p>
            )}
          </Field>

          <Field label="Salario maximo" error={form.formState.errors.salaryMax?.message}>
            {editing ? (
              <Input
                type="number"
                placeholder="max"
                {...form.register("salaryMax", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
              />
            ) : (
              <p className="text-sm">{formatSalary(offer.salaryMax)}</p>
            )}
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Clasificacion</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Empresa">
            {editing ? <Input {...form.register("company")} /> : <p className="text-sm">{offer.company || "-"}</p>}
          </Field>

          <Field label="Tipo de posicion">
            {editing ? (
              <Controller
                control={form.control}
                name="positionType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITION_TYPES.map((positionType) => (
                        <SelectItem key={positionType} value={positionType}>
                          {t(`positionTypes.${positionType}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <p className="text-sm">
                {offer.positionType ? t(`positionTypes.${offer.positionType}`) : "-"}
              </p>
            )}
          </Field>

          <Field label="Urgente">
            {editing ? (
              <Controller
                control={form.control}
                name="isUrgent"
                render={({ field }) => (
                  <label className="flex w-fit items-center gap-3 rounded-xl bg-background p-3">
                    <input
                      type="checkbox"
                      checked={!!field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      className="h-5 w-5 accent-primary"
                    />
                    <span className="text-sm font-medium">Marcar como urgente</span>
                  </label>
                )}
              />
            ) : (
              <p className="text-sm">{offer.isUrgent ? "Si" : "No"}</p>
            )}
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Etiquetas personalizadas</h2>
        <div className="flex flex-wrap gap-2">
          {customTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 px-3 py-1">
              #{tag}
              {editing && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  aria-label={`Quitar ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {!editing && customTags.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin etiquetas</p>
          )}
        </div>

        {editing && (
          <>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Anadir etiqueta y pulsar Enter"
                maxLength={30}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Anadir
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {customTags.length}/10 etiquetas - max 30 caracteres cada una
            </p>
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Imprescindibles</h2>
        <p className="text-xs text-muted-foreground">Sera usado por la IA al puntuar candidatos.</p>
        {editing ? (
          <>
            <Textarea {...form.register("mustHaves")} rows={5} maxLength={2000} />
            <p className="text-xs text-muted-foreground">{mustHaves.length}/2000 caracteres</p>
          </>
        ) : (
          <p className="whitespace-pre-line rounded-md border-l-4 border-primary bg-muted/40 p-3 text-sm">
            {offer.mustHaves || "No definido"}
          </p>
        )}
        {form.formState.errors.mustHaves && (
          <p className="text-xs text-destructive">{form.formState.errors.mustHaves.message}</p>
        )}
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
