// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import GlobalError from "@/app/error";

describe("GlobalError", () => {
  it("llama reset al presionar Reintentar", () => {
    const reset = vi.fn();

    render(<GlobalError error={new Error("boom")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
