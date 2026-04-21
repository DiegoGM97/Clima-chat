import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/fetch-timeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

import { getOpenWeather } from "@/action/actions";
import { fetchWithTimeout } from "@/lib/fetch-timeout";

const mockedFetchWithTimeout = vi.mocked(fetchWithTimeout);

describe("getOpenWeather", () => {
  beforeEach(() => {
    mockedFetchWithTimeout.mockReset();
  });

  it("retorna error cuando no llega ciudad", async () => {
    const result = await getOpenWeather("   ");
    expect(result.error).toBe("La ciudad es obligatoria.");
  });

  it("retorna mensaje amigable cuando no encuentra la ciudad", async () => {
    mockedFetchWithTimeout.mockResolvedValue(
      new Response(JSON.stringify({ cod: "404", message: "city not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await getOpenWeather("ciudad-invalida");

    expect(result.error).toBe(
      "No encontramos esa ciudad. Revisa el nombre e intenta otra vez.",
    );
  });

  it("retorna datos cuando la API responde ok", async () => {
    mockedFetchWithTimeout.mockResolvedValue(
      new Response(
        JSON.stringify({
          name: "Medellin",
          visibility: 10000,
          main: {
            temp: 24,
            humidity: 70,
            feels_like: 25,
            temp_min: 22,
            temp_max: 26,
            pressure: 1012,
          },
          weather: [
            { main: "Clouds", description: "scattered clouds", icon: "03d" },
          ],
          wind: { speed: 1.2 },
          clouds: { all: 40 },
          sys: { country: "CO" },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const result = await getOpenWeather("Medellin");

    expect(result.error).toBeUndefined();
    expect(result.data?.name).toBe("Medellin");
  });
});
