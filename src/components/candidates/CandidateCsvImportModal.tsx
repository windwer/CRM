"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

type ImportResult = {
  totalRows: number;
  createdCandidates: number;
  existingCandidates: number;
  applicationsCreated: number;
  applicationsSkipped: number;
  errors: Array<{ row: number; email?: string; message: string }>;
};

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

  const downloadTemplate = async () => {
    const response = await fetch("/api/candidates/import-csv");
    if (!response.ok) {
      toast({
        title: "No se pudo descargar la plantilla",
        variant: "destructive",
      });
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
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setIsImporting(true);
      setResult(null);
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
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: `Importacion completada: ${json.data.createdCandidates} nuevos, ${json.data.applicationsCreated} vinculaciones`,
      });
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

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isImporting) reset();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar candidatos por CSV</DialogTitle>
          <DialogDescription>
            Crea candidatos en bloque y, opcionalmente, vincula cada fila a una oferta
            usando `offerId` o `offerTitle` + `company`.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            Columnas principales: <span className="font-medium text-foreground">fullName</span>,{" "}
            <span className="font-medium text-foreground">email</span>, skills separadas por{" "}
            <span className="font-mono">|</span>, <span className="font-medium text-foreground">offerTitle</span>,{" "}
            <span className="font-medium text-foreground">company</span> y{" "}
            <span className="font-medium text-foreground">pipelineStageSlug</span>. El consentimiento
            GDPR debe venir como `true`.
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
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>

          {file && (
            <div className="rounded-md border px-3 py-2 text-sm">
              Archivo seleccionado: <span className="font-medium">{file.name}</span>
            </div>
          )}

          {result && (
            <div className="space-y-3 rounded-lg border p-4 text-sm">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <Metric label="Filas" value={result.totalRows} />
                <Metric label="Nuevos" value={result.createdCandidates} />
                <Metric label="Existentes" value={result.existingCandidates} />
                <Metric label="Vinculados" value={result.applicationsCreated} />
                <Metric label="Omitidos" value={result.applicationsSkipped} />
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  <p className="font-semibold">
                    {result.errors.length} filas con error. Primeras incidencias:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {result.errors.slice(0, 8).map((error) => (
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
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isImporting}>
            Cerrar
          </Button>
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
