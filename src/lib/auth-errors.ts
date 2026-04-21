function extractMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.toLowerCase();
  }

  return "";
}

export function isEmailRateLimitError(error: unknown): boolean {
  const message = extractMessage(error);
  return /email rate limit exceeded|rate limit/.test(message);
}

export function getAuthErrorMessage(error: unknown): string {
  const message = extractMessage(error);

  if (isEmailRateLimitError(error)) {
    return "Demasiados intentos. Intenta de nuevo en unos minutos.";
  }

  if (/invalid login credentials|invalid credentials/.test(message)) {
    return "Correo o contrasena incorrectos.";
  }

  if (/email not confirmed/.test(message)) {
    return "Debes confirmar tu correo antes de iniciar sesion.";
  }

  if (/already|registered|exists/.test(message)) {
    return "Este correo ya esta registrado. Inicia sesion.";
  }

  if (/username|duplicate|unique constraint/.test(message)) {
    return "Este nombre de usuario ya esta en uso. Prueba otro.";
  }

  if (/password should be at least|weak password/.test(message)) {
    return "Tu contrasena es muy debil. Usa al menos 8 caracteres.";
  }

  return "No pudimos completar la solicitud. Intenta nuevamente.";
}
