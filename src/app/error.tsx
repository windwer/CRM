"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error Boundary]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-black">Ha ocurrido un error</h1>
      <p className="max-w-md text-sm text-gray-500">
        {error?.message || "Error inesperado. Por favor, inténtalo de nuevo."}
      </p>
      {error?.digest && (
        <p className="text-xs text-gray-400">ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Reintentar
      </button>
    </main>
  );
}
