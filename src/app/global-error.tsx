"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Boundary]", error);
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: "sans-serif", padding: "2rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Algo no fue bien</h2>
        <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
          {error?.message || "Error inesperado en la aplicación."}
        </p>
        {error?.digest && (
          <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.5rem" }}>
            ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
