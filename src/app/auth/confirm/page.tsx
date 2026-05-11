"use client";

import { type EmailOtpType } from "@supabase/supabase-js";
import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/client";

function ConfirmAuthBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const nextRaw = searchParams.get("next");
    const next = nextRaw?.startsWith("/") ? nextRaw : "/";

    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const code = searchParams.get("code");

    async function confirm() {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace(next);
        return;
      }

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash,
        });
        if (error) {
          router.replace(
            `/auth/error?error=${encodeURIComponent(error.message)}`,
          );
          return;
        }
        router.replace(next);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace(
            `/auth/error?error=${encodeURIComponent(error.message)}`,
          );
          return;
        }
        router.replace(next);
        return;
      }

      router.replace(next);
    }

    void confirm();
  }, [router, searchParams]);

  return (
    <main className="sky-page flex min-h-screen items-center justify-center px-4">
      <p className="text-sm text-slate-600">Confirmando tu cuenta...</p>
    </main>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <main className="sky-page flex min-h-screen items-center justify-center px-4">
          <p className="text-sm text-slate-600">Cargando...</p>
        </main>
      }
    >
      <ConfirmAuthBody />
    </Suspense>
  );
}
