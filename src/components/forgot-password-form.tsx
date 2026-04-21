"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { getAuthErrorMessage, isEmailRateLimitError } from "@/lib/auth-errors";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      if (isEmailRateLimitError(error)) {
        setError(
          "Demasiados intentos de envio de correo. Intenta de nuevo en unos minutos.",
        );
      } else {
        setError(getAuthErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card className="sky-card">
          <CardHeader>
            <CardTitle className="text-2xl">Revisa tu correo</CardTitle>
            <CardDescription>
              Enviamos instrucciones para recuperar tu contrasena
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Si te registraste con correo y contrasena, recibiras un email para
              restablecerla.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="sky-card">
          <CardHeader>
            <CardTitle className="text-2xl">Restablecer contrasena</CardTitle>
            <CardDescription>
              Escribe tu correo y te enviaremos un enlace para restablecer tu
              contrasena
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo electronico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar correo de recuperacion"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Ya tienes una cuenta?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  Iniciar sesion
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
