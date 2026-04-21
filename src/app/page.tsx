"use client";

import Link from "next/link";
import { getOpenWeather } from "@/action/actions";
import { createClient } from "@/lib/client";
import { Weather } from "../../types/weather";
import { WeatherInfoCard } from "@/components/WeatherInfoCard";
import { WeatherSearchForm } from "@/components/WeatherSearchForm";
import { WeatherAIChat } from "@/components/WeatherAIChat";
import { RealtimeChat } from "@/components/realtime-chat";
import { useEffect, useState } from "react";

const DEFAULT_CITY = "Medellin";

type WeatherTheme = {
  imagePath: string;
  pageOverlay: string;
  weatherPanel: string;
};

function getWeatherTheme(condition?: string): WeatherTheme {
  const normalized = condition?.toLowerCase() ?? "";

  if (normalized.includes("thunderstorm")) {
    return {
      imagePath: "/fondos/tormenta.jpg",
      pageOverlay: "bg-slate-950/55",
      weatherPanel: "bg-sky-50/78",
    };
  }

  if (normalized.includes("drizzle") || normalized.includes("rain")) {
    return {
      imagePath: "/fondos/lluvia.webp",
      pageOverlay: "bg-blue-950/45",
      weatherPanel: "bg-sky-50/78",
    };
  }

  if (normalized.includes("snow")) {
    return {
      imagePath: "/fondos/nieve.jpg",
      pageOverlay: "bg-slate-900/35",
      weatherPanel: "bg-sky-50/78",
    };
  }

  if (
    normalized.includes("mist") ||
    normalized.includes("fog") ||
    normalized.includes("haze") ||
    normalized.includes("smoke")
  ) {
    return {
      imagePath: "/fondos/niebla.jpg",
      pageOverlay: "bg-slate-900/45",
      weatherPanel: "bg-sky-50/78",
    };
  }

  if (normalized.includes("cloud")) {
    return {
      imagePath: "/fondos/nublado.avif",
      pageOverlay: "bg-slate-900/45",
      weatherPanel: "bg-sky-50/78",
    };
  }

  return {
    imagePath: "/fondos/despejado.avif",
    pageOverlay: "bg-cyan-950/35",
    weatherPanel: "bg-sky-50/78",
  };
}

function toRoomSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function Home() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [lastRequestedCity, setLastRequestedCity] = useState(DEFAULT_CITY);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const fetchWeatherByCity = async (city: string) => {
    const trimmedCity = city.trim();

    if (!trimmedCity) {
      setError("Debes escribir una ciudad para buscar.");
      setWeather(null);
      return;
    }

    setLastRequestedCity(trimmedCity);
    setIsWeatherLoading(true);

    const { data, error } = await getOpenWeather(trimmedCity);

    if (data) {
      setError(null);
      setWeather(data);
      setIsWeatherLoading(false);
      return;
    }

    setWeather(null);
    setError(error ?? "No se encontro informacion para esa ciudad.");
    setIsWeatherLoading(false);
  };

  const handleSearch = async (formData: FormData) => {
    const city = formData.get("city") as string;
    await fetchWeatherByCity(city);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchWeatherByCity(DEFAULT_CITY);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const loadCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? null);
      setUsername(
        typeof user?.user_metadata?.username === "string"
          ? user.user_metadata.username
          : null,
      );
    };

    void loadCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setUserEmail(session?.user?.email ?? null);
      setUsername(
        typeof session?.user?.user_metadata?.username === "string"
          ? session.user.user_metadata.username
          : null,
      );
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserId(null);
    setUserEmail(null);
    setUsername(null);
  };

  const currentCityLabel = weather
    ? `${weather.name}, ${weather.sys.country}`
    : DEFAULT_CITY;
  const currentWeatherCondition = weather?.weather?.[0]?.main;
  const weatherTheme = getWeatherTheme(currentWeatherCondition);
  const cityRoomBase = weather
    ? `${weather.name}-${weather.sys.country}`
    : DEFAULT_CITY;
  const cityRoomSlug = toRoomSlug(cityRoomBase);
  const cityRoomName = `clima-chat-city-${cityRoomSlug || "global"}`;

  const userLabel = username ? `@${username}` : userEmail;
  const avatarText = (username ?? userEmail ?? "US").slice(0, 2).toUpperCase();
  const realtimeChatUsername =
    username ?? userEmail?.split("@")[0] ?? "usuario";
  const glassPanelClass =
    "rounded-2xl border border-white/35 bg-white/20 shadow-[0_20px_45px_-28px_rgba(14,116,144,0.6)] backdrop-blur-md";

  return (
    <>
      <main
        className="relative min-h-screen bg-cover bg-center bg-no-repeat p-4 lg:p-6"
        style={{ backgroundImage: `url(${weatherTheme.imagePath})` }}
      >
        <div
          className={`pointer-events-none absolute inset-0 ${weatherTheme.pageOverlay}`}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <header className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between rounded-2xl border border-white/30 bg-white/20 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white">Clima Chat</span>
              <span className="hidden text-xs uppercase tracking-[0.2em] text-white/75 sm:inline">
                pronostico en vivo
              </span>
            </div>

            <nav className="flex items-center gap-2">
              {userEmail ? (
                <>
                  <div className="hidden items-center gap-2 rounded-full border border-white/45 bg-white/20 px-2 py-1 sm:flex">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {avatarText}
                    </div>
                    <span className="max-w-36 truncate pr-2 text-sm text-white">
                      {userLabel}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-md border border-white/50 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    Cerrar sesion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="rounded-md border border-white/50 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    Iniciar sesion
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Crear cuenta
                  </Link>
                </>
              )}
            </nav>
          </header>

          <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2">
            <section
              className={`w-full max-w-md space-y-4 p-4 lg:max-w-lg ${glassPanelClass} ${weatherTheme.weatherPanel}`}
            >
              <WeatherSearchForm onSearch={handleSearch} />

              {isWeatherLoading ? (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white/70 p-4">
                  <div className="h-5 w-32 animate-pulse rounded-md bg-sky-100" />
                  <div className="h-10 w-40 animate-pulse rounded-md bg-sky-100" />
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`weather-skeleton-${index}`}
                        className="h-16 animate-pulse rounded-xl bg-slate-100"
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {!isWeatherLoading && error ? (
                <div className="rounded-xl border border-red-200 bg-red-50/80 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    type="button"
                    onClick={() => fetchWeatherByCity(lastRequestedCity)}
                    className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                  >
                    Reintentar busqueda
                  </button>
                </div>
              ) : null}

              {!isWeatherLoading && !error && weather ? (
                <WeatherInfoCard weather={weather} />
              ) : null}

              {!isWeatherLoading && !error && !weather ? (
                <div className="rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
                  Busca una ciudad para ver su informacion del clima.
                </div>
              ) : null}
            </section>

            <section
              className={`flex h-[560px] min-h-[560px] items-stretch justify-center p-4 lg:h-[710px] lg:min-h-[600px] ${glassPanelClass}`}
            >
              <div className="h-full min-h-0 w-full overflow-hidden rounded-2xl border border-slate-200/85 bg-slate-50/95 shadow-xl">
                {userEmail && userId ? (
                  <RealtimeChat
                    roomName={cityRoomName}
                    roomLabel={currentCityLabel}
                    username={realtimeChatUsername}
                    userId={userId}
                  />
                ) : (
                  <div className="flex h-full min-h-[420px] flex-col items-center justify-center px-8 text-center">
                    <p className="text-lg font-semibold text-slate-800">
                      Inicia sesion para entrar al chat en tiempo real
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Veras los usuarios conectados y podras conversar con ellos
                      al instante.
                    </p>
                    <div className="mt-5 flex gap-2">
                      <Link
                        href="/auth/login"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                      >
                        Iniciar sesion
                      </Link>
                      <Link
                        href="/auth/sign-up"
                        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        Crear cuenta
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <WeatherAIChat currentCity={currentCityLabel} />
    </>
  );
}

export default Home;
