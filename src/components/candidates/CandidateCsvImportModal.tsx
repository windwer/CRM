"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

type WarningEntry = {
  email: string;
  offerTitle?: string;
};

type WarningAction = "import_anyway" | "skip" | "reactivate_and_import";

type ConfirmResult = {
  imported: number;
  applicationsCreated: number;
  skipped: number;
  reactivated: number;
  invalid: Array<{ row: number; email?: string; message: string }>;
  requires_confirmation: false;
};

type WarningsResponse = {
  imported: number;
  applicationsCreated: number;
  warnings: {
    in_active_offer: WarningEntry[];
    discarded: WarningEntry[];
  };
  invalid: Array<{ row: number; email?: string; message: string }>;
  requires_confirmation: true;
};

type ImportResult = ConfirmResult | WarningsResponse;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CandidateCsvImportModal({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [decisions, setDecisions] = useState<Map<string, WarningAction>>(new Map());

  const warnings =
    result?.requires_confirmation
      ? (result as WarningsResponse).warnings
      : null;

  const downloadTemplate = async () => {
    const response = await fetch("/api/candidates/import-csv");
    if (!response.ok) {
      toast({ title: "No se pudo descargar la plantilla", variant: "destructive" });
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla-candidatos.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setDecisions(new Map());
    if (inputRef.current) inputRef.current.value = "";
  };

  const setDecision = (email: string, action: WarningAction) => {
    setDecisions((prev) => {
      const next = new Map(prev);
      next.set(email, action);
      return next;
    });
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setIsImporting(true);
      setResult(null);
      setDecisions(new Map());
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/candidates/import-csv", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error?.message ?? "No se pudo importar el CSV");
      }

      setResult(json.data);

      if (!json.data.requires_confirmation) {
        queryClient.invalidateQueries({ queryKey: ["candidates"] });
        queryClient.invalidateQueries({ queryKey: ["applications"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        toast({
          title: `Importacion completada: ${json.data.imported} nuevos candidatos`,
        });
      } else {
        toast({
          title: `${json.data.imported} importados — ${
            json.data.warnings.in_active_offer.length + json.data.warnings.discarded.length
          } requieren decision`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error al importar CSV",
        description: error?.message ?? "Revisa el archivo e intentalo de nuevo",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirm = async () => {
    if (!file || !warnings) return;

    // Build decisions list — default is "skip"
    const allWarnings = [
      ...warnings.in_active_offer.map((w) => ({ email: w.email, type: "B" as const })),
      ...warnings.discarded.map((w) => ({ email: w.email, type: "C" as const })),
    ];

    const confirmationList = allWarnings.map((w) => ({
      email: w.email,
      action: decisions.get(w.email) ?? "skip",
    }));

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("confirmation", JSON.stringify(confirmationList));

      const response = await fetch("/api/candidates/import-csv", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error?.message ?? "Error al aplicar decisiones");
      }

      setResult(json.data);
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      const { imported, skipped, reactivated } = json.data as ConfirmResult;
      toast({
        title: `Completado: ${imported} importados, ${skipped} omitidos, ${reactivated} reactivados`,
      });
    } catch (error: any) {
      toast({
        title: "Error al confirmar",
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isImporting) reset();
    onOpenChange(nextOpen);
  };

  const finalResult = result && !result.requires_confirmation ? (result as ConfirmResult) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar candidatos por CSV</DialogTitle>
          <DialogDescription>
            Crea candidatos en bloque y, opcionalmente, vincula cada fila a una oferta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Step 1: File selection */}
          {!warnings && (
            <>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                Columnas principales:{" "}
                <span className="font-medium text-foreground">fullName</span>,{" "}
                <span className="font-medium text-foreground">email</span>,{" "}
                <span className="font-medium text-foreground">salaryExpectationMax</span>,{" "}
                skills separadas por{" "}
                <span className="font-mono">|</span>,{" "}
                <span className="font-medium text-foreground">offerTitle</span>.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="outline" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar plantilla
                </Button>
                <Input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setResult(null);
                    setDecisions(new Map());
                  }}
                />
              </div>

              {file && (
                <div className="rounded-md border px-3 py-2 text-sm">
                  Archivo seleccionado:{" "}
                  <span className="font-medium">{file.name}</span>
                </div>
              )}
            </>
          )}

          {/* Step 2: Warnings that need decisions */}
          {warnings && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-sm">
                  <strong>{result?.imported ?? 0}</strong> candidatos nuevos importados.{" "}
                  Los siguientes requieren una decision antes de continuar.
                </p>
              </div>

              {warnings.in_active_offer.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">
                    Ya vinculados a oferta activa ({warnings.in_active_offer.length})
                  </h3>
                  <div className="divide-y rounded-lg border text-sm">
                    {warnings.in_active_offer.map((w) => (
                      <div
                        key={w.email}
                        className="flex items-center justify-between gap-3 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">{w.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Oferta actual: {w.offerTitle}
                          </p>
                        </div>
                        <Select
                          value={decisions.get(w.email) ?? "skip"}
                          onValueChange={(val) => setDecision(w.email, val as WarningAction)}
                        >
                          <SelectTrigger className="w-52">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip">Omitir esta fila</SelectItem>
                            <SelectItem value="import_anyway">
                              Vincular a nueva oferta también
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {warnings.discarded.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">
                    Candidatos descartados ({warnings.discarded.length})
                  </h3>
                  <div className="divide-y rounded-lg border text-sm">
                    {warnings.discarded.map((w) => (
                      <div
                        key={w.email}
                        className="flex items-center justify-between gap-3 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">{w.email}</p>
                          <Badge variant="destructive" className="text-[10px]">
                            Descartado
                          </Badge>
                        </div>
                        <Select
                          value={decisions.get(w.email) ?? "skip"}
                          onValueChange={(val) => setDecision(w.email, val as WarningAction)}
                        >
                          <SelectTrigger className="w-52">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip">
                              Mantener descartado, no importar
                            </SelectItem>
                            <SelectItem value="reactivate_and_import">
                              Reactivar y vincular
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Step 3: Final result */}
          {finalResult && (
            <div className="space-y-3 rounded-lg border p-4 text-sm">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Metric label="Importados" value={finalResult.imported} />
                <Metric label="Vinculaciones" value={finalResult.applicationsCreated} />
                <Metric label="Omitidos" value={finalResult.skipped} />
                <Metric label="Reactivados" value={finalResult.reactivated} />
              </div>

              {finalResult.invalid.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  <p className="font-semibold">
                    {finalResult.invalid.length} filas omitidas por error:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {finalResult.invalid.slice(0, 8).map((error) => (
                      <li key={`${error.row}-${error.email ?? error.message}`}>
                        Fila {error.row}
                        {error.email ? ` (${error.email})` : ""}: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isImporting}
          >
            {finalResult ? "Cerrar" : "Cancelar"}
          </Button>

          {!warnings && !finalResult && (
            <Button onClick={handleImport} disabled={!file || isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar CSV
                </>
              )}
            </Button>
          )}

          {warnings && !finalResult && (
            <Button onClick={handleConfirm} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aplicando...
                </>
              ) : (
                "Aplicar decisiones"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
