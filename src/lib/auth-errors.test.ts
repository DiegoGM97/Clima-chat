import { describe, expect, it } from "vitest";

import { getAuthErrorMessage, isEmailRateLimitError } from "@/lib/auth-errors";

describe("auth errors", () => {
  it("detecta rate limit de email", () => {
    const error = new Error("email rate limit exceeded");
    expect(isEmailRateLimitError(error)).toBe(true);
  });

  it("mapea invalid credentials a mensaje legible", () => {
    const error = new Error("Invalid login credentials");
    expect(getAuthErrorMessage(error)).toBe("Correo o contrasena incorrectos.");
  });

  it("retorna fallback amigable en error desconocido", () => {
    const error = new Error("unexpected provider issue");
    expect(getAuthErrorMessage(error)).toBe(
      "No pudimos completar la solicitud. Intenta nuevamente.",
    );
  });

  it("mapea username repetido a nombre de usuario", () => {
    const error = new Error(
      "duplicate key value violates unique constraint username",
    );
    expect(getAuthErrorMessage(error)).toBe(
      "Este nombre de usuario ya esta en uso. Prueba otro.",
    );
  });
});
