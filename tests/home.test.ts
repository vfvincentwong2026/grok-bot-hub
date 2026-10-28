import { describe, expect, it } from "vitest";
import worker from "../workers/src/index";

describe("GET /", () => {
  it("renders the registry homepage with bots and agent cards", async () => {
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
    expect(html).toContain("Request Creator");
    expect(html).toContain("Request Studio");
  });

  it("enables real checkout buttons only when Stripe is configured", async () => {
    const env = {
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_PRICE_CREATOR_MONTHLY: "price_creator_monthly",
      STRIPE_PRICE_CREATOR_ANNUAL: "price_creator_annual",
      STRIPE_PRICE_STUDIO_MONTHLY: "price_studio_monthly",
      STRIPE_PRICE_STUDIO_ANNUAL: "price_studio_annual",
    };
    const response = await worker.fetch(new Request("http://localhost/pricing"), env as any);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('data-plan="creator"');
    expect(html).toContain('data-plan="studio"');
    expect(html).toContain("Choose Creator");
    expect(html).toContain("Choose Studio");
  });
});
