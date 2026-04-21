"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("app", "Error de render en cliente", error);
  }, [error]);

  return (
    <main className="sky-page flex min-h-screen items-center justify-center px-4">
      <section className="sky-page-content sky-card w-full max-w-md rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Ocurrio un problema
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Algo fallo en la aplicacion
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Puedes intentar nuevamente. Si persiste, recarga la pagina o vuelve a
          iniciar sesion.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Reintentar
        </button>
      </section>
    </main>
  );
}
