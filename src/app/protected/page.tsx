import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/server";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <main className="sky-page flex items-center justify-center px-4 py-10">
      <section className="sky-page-content sky-card w-full max-w-md rounded-2xl px-6 py-7 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Zona protegida
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Bienvenido
        </h1>
        <p className="mt-2 text-sm text-slate-700">
          Sesion activa con{" "}
          <span className="font-medium">{data.claims.email}</span>
        </p>
        <div className="mt-5 flex justify-center">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
