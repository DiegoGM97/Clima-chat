

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WeatherInfoCard } from "@/components/WeatherInfoCard";

describe("WeatherInfoCard", () => {
  it("renderiza ciudad, estado y metrica principal", () => {
    render(
      <WeatherInfoCard
        weather={{
          name: "Medellin",
          visibility: 10000,
          main: {
            temp: 24,
            humidity: 78,
            feels_like: 24,
            temp_min: 20,
            temp_max: 27,
            pressure: 1012,
          },
          weather: [
            {
              main: "Clouds",
              description: "scattered clouds",
              icon: "03d",
            },
          ],
          wind: {
            speed: 1.18,
          },
          clouds: {
            all: 42,
          },
          sys: {
            country: "CO",
          },
        }}
      />,
    );

    expect(screen.getByText("Medellin")).toBeInTheDocument();
    expect(screen.getByText("Nublado")).toBeInTheDocument();
    expect(screen.getByText("Sensacion termica")).toBeInTheDocument();
    expect(screen.getByText("78%")).toBeInTheDocument();
  });
});
