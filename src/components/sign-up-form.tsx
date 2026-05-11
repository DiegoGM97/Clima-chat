"use client";

import { useRouter } from "next/navigation";
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

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    const normalizedUsername = username.trim().toLowerCase();
    const usernameIsValid = /^[a-z0-9_]{3,20}$/.test(normalizedUsername);

    if (!usernameIsValid) {
      setError(
        "El nombre de usuario debe tener 3-20 caracteres y solo usar letras, numeros o guion bajo",
      );
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("Las contrasenas no coinciden");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/`,
          data: {
            username: normalizedUsername,
          },
        },
      });

      if (error) {
        if (isEmailRateLimitError(error)) {
          setError(
            "Demasiados intentos de envio de correo. Intenta de nuevo en unos minutos.",
          );
          return;
        }

        const alreadyExists = /already|registered|exists/i.test(error.message);
        if (alreadyExists) {
          setError("Este correo ya esta registrado. Inicia sesion.");
          return;
        }

        const usernameTaken = /username|duplicate|unique constraint/i.test(
          error.message,
        );
        if (usernameTaken) {
          setError("Este nombre de usuario ya esta en uso. Prueba otro.");
          return;
        }

        throw error;
      }

      const identities = data.user?.identities ?? [];
      if (data.user && identities.length === 0) {
        setError("Este correo ya esta registrado. Inicia sesion.");
        return;
      }

      router.push("/");
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
      <Card className="sky-card">
        <CardHeader>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>Registra una cuenta nueva</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="tu_nombre"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
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
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contrasena</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repetir contrasena</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Ya tienes una cuenta?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Iniciar sesion
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
