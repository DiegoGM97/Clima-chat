import { describe, expect, it } from "vitest";

import { applyRateLimit } from "@/lib/rate-limit";

describe("rate limit", () => {
  it("permite requests dentro del limite", async () => {
    const key = `test-allow-${crypto.randomUUID()}`;

    const first = await applyRateLimit(key, 2, 60_000);
    const second = await applyRateLimit(key, 2, 60_000);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
  });

  it("bloquea requests cuando se supera el limite", async () => {
    const key = `test-block-${crypto.randomUUID()}`;

    await applyRateLimit(key, 1, 60_000);
    const blocked = await applyRateLimit(key, 1, 60_000);

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
