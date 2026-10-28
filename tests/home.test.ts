import { describe, expect, it } from "vitest";
import worker from "../workers/src/index";

describe("GET /", () => {
  it("renders the registry homepage with IDR 30-day passes", async () => {
    const response = await worker.fetch(new Request("http://localhost/"), {} as any);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("GrokBotHub");
    expect(html).toContain("Drama Hook Analyzer");
    expect(html).toContain("Viral Radar");
    expect(html).toContain("DM Funnel");
    expect(html).toContain("Agent Card contracts");
    expect(html).toContain("Live leaderboard");
    expect(html).toContain("From first hook to full slate");
    expect(html).toContain("Rp449,000");
    expect(html).toContain("Rp1,499,000");
    expect(html).toContain("no auto-renew");
    expect(html).toContain("Request Creator");
    expect(html).toContain("Request Studio");
  });

  it("enables real checkout buttons only when Stripe is configured", async () => {
    const env = {
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_PRICE_CREATOR_IDR: "price_creator_idr",
      STRIPE_PRICE_STUDIO_IDR: "price_studio_idr",
    };
    const response = await worker.fetch(new Request("http://localhost/pricing"), env as any);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('data-plan="creator"');
    expect(html).toContain('data-plan="studio"');
    expect(html).toContain("Buy Creator 30-day pass");
    expect(html).toContain("Buy Studio 30-day pass");
  });
});

describe("legal pages", () => {
  it.each([
    ["/terms", "Terms of Service"],
    ["/privacy", "Privacy Policy"],
    ["/refunds", "Refund Policy"],
  ])("renders %s", async (path, title) => {
    const response = await worker.fetch(new Request(`http://localhost${path}`), {} as any);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(title);
    expect(html).toContain("Effective 28 October 2026");
    expect(html).toContain("GrokBotHub");
  });
});
