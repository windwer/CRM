"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAI } from "@/hooks/useAI";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useTranslations } from "next-intl";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface CVUploaderProps {
  candidateId: string;
  onUploadSuccess?: (blobId: string) => void;
}

export function CVUploader({ candidateId, onUploadSuccess }: CVUploaderProps) {
  const t = useTranslations("candidates.cv");
  const commonT = useTranslations("common");
  const toastT = useTranslations("toasts");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [blobId, setBlobId] = useState<string | null>(null);
  const { parseCV, isParsing } = useAI();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setBlobId(null);
      setPdfError(null);
    }
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setIsPdfLoading(false);
      setPdfError(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsPdfLoading(true);
    setPdfError(null);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.post(`/api/candidates/${candidateId}/upload-cv`, formData);
      setBlobId(data.data.blobId);
      toast({ title: t("parsed") });
      onUploadSuccess?.(data.data.blobId);
    } catch (error: any) {
      toast({ 
        title: commonT("error"), 
        description: error.response?.data?.error?.message || toastT("unknownError"),
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleParse = async () => {
    if (!blobId) return;
    await parseCV({ candidateId, blobId });
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer
          ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"}
          ${file ? "border-primary/50 bg-primary/5" : ""}
        `}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="text-center space-y-2">
            <div className="bg-primary/10 p-3 rounded-full inline-block">
              <FileText className="text-primary h-8 w-8" />
            </div>
            <p className="font-medium text-sm">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="bg-muted p-3 rounded-full inline-block">
              <Upload className="text-muted-foreground h-8 w-8" />
            </div>
            <p className="font-medium text-sm">{t("upload")}</p>
            <p className="text-xs text-muted-foreground">{t("uploadHint")}</p>
          </div>
        )}
      </div>

      {previewUrl ? (
        <div className="overflow-hidden rounded-xl border bg-background">
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
            <div>
              <h4 className="text-sm font-bold">{t("page", { page: 1 })}</h4>
              <p className="text-xs text-muted-foreground">{t("uploadHint")}</p>
            </div>
            {isPdfLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>

          <div className="flex min-h-[420px] items-center justify-center bg-slate-100 p-4">
            {pdfError ? (
              <div className="max-w-sm rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
                <p className="text-sm font-bold text-destructive">{t("previewError")}</p>
                <p className="mt-1 text-xs text-destructive/80">{pdfError}</p>
              </div>
            ) : (
              <Document
                file={previewUrl}
                loading={
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("previewLoading")}
                  </div>
                }
                onLoadSuccess={() => setIsPdfLoading(false)}
                onLoadError={() => {
                  setIsPdfLoading(false);
                  setPdfError(t("previewError"));
                }}
              >
                <Page pageNumber={1} width={360} />
              </Document>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex gap-3">
        {!blobId ? (
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading} 
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {commonT("loading")}
              </>
            ) : (
              t("upload")
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleParse} 
            disabled={isParsing} 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isParsing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("parsing")}
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t("parse")}
              </>
            )}
          </Button>
        )}
        {file && !isUploading && !isParsing && (
          <Button variant="ghost" onClick={() => { setFile(null); setBlobId(null); }}>
            {commonT("cancel")}
          </Button>
        )}
      </div>
    </div>
  );
}
