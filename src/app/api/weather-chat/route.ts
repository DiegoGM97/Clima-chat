import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { applyRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_TIMEOUT_MS = 10000;
const CHAT_RATE_LIMIT = 20;
const CHAT_RATE_WINDOW_MS = 60_000;

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip")?.trim() || "anonymous";
}

function withRateLimitHeaders(
  response: NextResponse,
  resetAt: number,
  remaining: number,
) {
  response.headers.set("X-RateLimit-Limit", String(CHAT_RATE_LIMIT));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.floor(resetAt / 1000)));
  return response;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = await applyRateLimit(
    `weather-chat:${ip}`,
    CHAT_RATE_LIMIT,
    CHAT_RATE_WINDOW_MS,
  );

  if (!rate.allowed) {
    const retryAfterSeconds = Math.max(
      Math.ceil((rate.resetAt - Date.now()) / 1000),
      1,
    );

    const response = NextResponse.json(
      {
        error:
          "Has enviado muchas solicitudes al asistente. Intenta de nuevo en un minuto.",
      },
      { status: 429 },
    );

    response.headers.set("Retry-After", String(retryAfterSeconds));
    return withRateLimitHeaders(response, rate.resetAt, rate.remaining);
  }

  try {
    const { message, currentCity } = await request.json();
    if (typeof message !== "string") {
      return withRateLimitHeaders(
        NextResponse.json(
          { error: "Formato de mensaje invalido." },
          { status: 400 },
        ),
        rate.resetAt,
        rate.remaining,
      );
    }

    const trimmedMessage = typeof message === "string" ? message.trim() : "";

    if (!trimmedMessage) {
      return withRateLimitHeaders(
        NextResponse.json(
          { error: "Debes enviar una pregunta para el chat." },
          { status: 400 },
        ),
        rate.resetAt,
        rate.remaining,
      );
    }

    if (trimmedMessage.length > 600) {
      return withRateLimitHeaders(
        NextResponse.json(
          { error: "Tu mensaje es muy largo. Intenta resumirlo." },
          { status: 400 },
        ),
        rate.resetAt,
        rate.remaining,
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return withRateLimitHeaders(
        NextResponse.json(
          { error: "Falta configurar GROQ_API_KEY en el servidor." },
          { status: 500 },
        ),
        rate.resetAt,
        rate.remaining,
      );
    }

    const contextCity =
      typeof currentCity === "string" && currentCity.trim()
        ? currentCity.trim()
        : "sin ciudad seleccionada";

    const systemPrompt = [
      "Eres un asistente especializado en clima y tiempo atmosferico.",
      "Responde en espanol claro, practico y breve.",
      "Tus respuestas deben tener maximo 3 frases cortas.",
      "Evita introducciones largas, relleno y explicaciones extensas.",
      "Prioriza accion concreta: clima esperado, recomendacion y precaucion.",
      "Solo responde temas relacionados con clima, ciudades, pronosticos, recomendaciones de ropa o viaje por condiciones climaticas.",
      "Si te preguntan otro tema, redirige cordialmente a temas del clima.",
      `Ciudad en contexto de la app: ${contextCity}.`,
    ].join(" ");

    const groqRes = await fetchWithTimeout(
      GROQ_API_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.4,
          max_tokens: 180,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: trimmedMessage,
            },
          ],
        }),
      },
      GROQ_TIMEOUT_MS,
    );

    const groqPayload = await groqRes.json().catch(() => null);

    if (!groqRes.ok) {
      const isRateLimited = groqRes.status === 429;
      return withRateLimitHeaders(
        NextResponse.json(
          {
            error: isRateLimited
              ? "El asistente esta recibiendo muchas solicitudes. Intenta en un momento."
              : "No pudimos procesar tu consulta en este momento.",
          },
          { status: groqRes.status },
        ),
        rate.resetAt,
        rate.remaining,
      );
    }

    const reply = groqPayload?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return withRateLimitHeaders(
        NextResponse.json(
          { error: "No se recibio respuesta del asistente." },
          { status: 502 },
        ),
        rate.resetAt,
        rate.remaining,
      );
    }

    return withRateLimitHeaders(
      NextResponse.json({ reply }),
      rate.resetAt,
      rate.remaining,
    );
  } catch (error) {
    logError("weather-chat", "Error procesando mensaje", error);
    if (error instanceof Error && /tardo demasiado/i.test(error.message)) {
      return withRateLimitHeaders(
        NextResponse.json(
          { error: "El asistente tardo demasiado en responder." },
          { status: 504 },
        ),
        rate.resetAt,
        rate.remaining,
      );
    }

    return withRateLimitHeaders(
      NextResponse.json(
        { error: "Error interno al procesar el chat de clima." },
        { status: 500 },
      ),
      rate.resetAt,
      rate.remaining,
    );
  }
}
