"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold">Ha ocurrido un error</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error?.message || "Error inesperado al cargar esta página."}
      </p>
      {error?.digest && (
        <p className="text-xs text-muted-foreground">ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Reintentar
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
