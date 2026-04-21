"use server";
import { Weather } from "../../types/weather";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { logError } from "@/lib/logger";

const OPEN_WEATHER_TIMEOUT_MS = 8000;

export async function getOpenWeather(city: string): Promise<{
  data?: Weather;
  error?: string;
}> {
  try {
    const trimmedCity = city.trim();

    if (!trimmedCity) {
      return { error: "La ciudad es obligatoria." };
    }

    const res = await fetchWithTimeout(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(trimmedCity)}&appid=${process.env.OPEN_WEATHER_API_KEY}&units=metric`,
      { cache: "no-store" },
      OPEN_WEATHER_TIMEOUT_MS,
    );

    const payload = await res.json();

    if (!res.ok) {
      const notFound = payload?.cod === "404" || payload?.cod === 404;
      return {
        error: notFound
          ? "No encontramos esa ciudad. Revisa el nombre e intenta otra vez."
          : "No se pudo obtener el clima en este momento.",
      };
    }

    return { data: payload as Weather };
  } catch (error) {
    logError("weather", "Error consultando OpenWeather", error);
    if (error instanceof Error && /tardo demasiado/i.test(error.message)) {
      return { error: "La consulta esta tardando mucho. Intenta de nuevo." };
    }

    return { error: "Ocurrio un error al consultar el clima." };
  }
}
