"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PDFViewerInnerProps {
  fileUrl: string | null;
}

export default function PDFViewerInner({ fileUrl }: PDFViewerInnerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  if (!fileUrl) return null;

  return (
    <div className="overflow-hidden rounded border bg-gray-50">
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
          setError(null);
        }}
        onLoadError={(err) => {
          console.error("PDF load error:", err);
          setError("No se pudo cargar el PDF");
        }}
        loading={
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-gray-500">Cargando PDF...</p>
          </div>
        }
      >
        {error ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : (
          <div className="flex justify-center p-3">
            <Page
              pageNumber={1}
              width={400}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </div>
        )}
      </Document>
      {numPages > 1 && (
        <p className="py-1 text-center text-xs text-gray-400">
          Pagina 1 de {numPages}
        </p>
      )}
    </div>
  );
}
