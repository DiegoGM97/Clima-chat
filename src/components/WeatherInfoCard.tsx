import { Weather } from "../../types/weather";

interface WeatherInfoCardProps {
  weather: Weather;
}

const WEATHER_MAIN_ES: Record<string, string> = {
  clear: "Despejado",
  clouds: "Nublado",
  rain: "Lluvia",
  drizzle: "Llovizna",
  thunderstorm: "Tormenta",
  snow: "Nieve",
  mist: "Neblina",
  fog: "Niebla",
  haze: "Bruma",
  smoke: "Humo",
  dust: "Polvo",
  sand: "Arena",
  ash: "Ceniza",
  squall: "Rafaga fuerte",
  tornado: "Tornado",
};

const WEATHER_DESCRIPTION_ES: Record<string, string> = {
  "clear sky": "cielo despejado",
  "few clouds": "pocas nubes",
  "scattered clouds": "nubes dispersas",
  "broken clouds": "nubes fragmentadas",
  "overcast clouds": "cielo cubierto",
  "light rain": "lluvia ligera",
  rain: "lluvia",
  thunderstorm: "tormenta",
  snow: "nieve",
  mist: "neblina",
  fog: "niebla",
};

function translateWeatherMain(value: string) {
  return WEATHER_MAIN_ES[value.toLowerCase()] ?? value;
}

function translateWeatherDescription(value: string) {
  return WEATHER_DESCRIPTION_ES[value.toLowerCase()] ?? value;
}

export function WeatherInfoCard({ weather }: WeatherInfoCardProps) {
  const translatedMain = translateWeatherMain(weather.weather[0].main);
  const translatedDescription = translateWeatherDescription(
    weather.weather[0].description,
  );

  const weatherDetails = [
    {
      label: "Sensacion termica",
      value: `${Math.round(weather.main.feels_like)} °C`,
    },
    {
      label: "Temperatura minima",
      value: `${Math.round(weather.main.temp_min)} °C`,
    },
    {
      label: "Temperatura maxima",
      value: `${Math.round(weather.main.temp_max)} °C`,
    },
    {
      label: "Humedad",
      value: `${weather.main.humidity}%`,
    },
    {
      label: "Presion",
      value: `${weather.main.pressure} hPa`,
    },
    {
      label: "Viento",
      value: `${weather.wind.speed} m/s`,
    },
    {
      label: "Nubosidad",
      value: `${weather.clouds.all}%`,
    },
    {
      label: "Visibilidad",
      value: `${(weather.visibility / 1000).toFixed(1)} km`,
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-white/50 bg-blue-200 p-6 shadow-xl backdrop-blur-md antialiased">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            {weather.sys.country}
          </p>
          <h2 className="text-3xl font-semibold text-slate-900">
            {weather.name}
          </h2>
          <p className="mt-2 text-base capitalize text-slate-600">
            {translatedDescription}
          </p>
        </div>

        <img
          src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
          alt={translatedDescription}
          width={64}
          height={64}
          className="h-16 w-16"
        />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4 rounded-2xl bg-sky-100/70 px-4 py-3">
        <div>
          <p className="text-sm text-slate-500">Temperatura actual</p>
          <p className="text-5xl font-semibold leading-none text-slate-900">
            {Math.round(weather.main.temp)}
            <span className="text-2xl align-top">°C</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Estado</p>
          <p className="text-lg font-medium text-slate-800">{translatedMain}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3">
        {weatherDetails.map((detail) => (
          <div
            key={detail.label}
            className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 sm:px-4 sm:py-3"
          >
            <p className="text-xs text-slate-500 sm:text-sm">{detail.label}</p>
            <p className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
              {detail.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
