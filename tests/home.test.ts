import { describe, expect, it } from "vitest";
import worker from "../workers/src/index";

describe("GET /", () => {
  it("defaults to an Indonesian-first demo with one primary journey", async () => {
    const response = await worker.fetch(new Request("http://localhost/"), {} as any);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain('<html lang="id">');
    expect(html).toContain("Hook 3 detik pertama, dinilai dan ditulis ulang.");
    expect(html).toContain("Coba hook Bahasa Indonesia →");
    expect(html).toContain("Kamu bilang aku hanya seorang pelayan");
    expect(html).toContain('<option value="tiktok" selected>TikTok</option>');
    expect(html).toContain('id="input-language"');
    expect(html).toContain('id="target-audience"');
    expect(html).toContain('id="demo-platform"');
    expect(html).toContain('id="output-language"');
    expect(html).toContain("gbh_demo_options");
    expect(html).toContain("analysis.rewritten_hooks");
    expect(html).toContain("analysis.dimensions");
    expect(html).toContain("copyRewrite");
    expect(html).toContain('window.gbhTrack("rewrite_copy")');
    expect(html).toContain('window.gbhTrack("landing_view")');
    expect(html).toContain('window.gbhTrack("demo_start")');
    expect(html).not.toContain("Legacy discovery cards");
    expect(html).not.toContain("Telemetry leaderboard");
    expect(html).not.toContain("Public analysis blueprints");
    expect(html).not.toContain("Raw discovery cards");
    expect(html).toContain("new AbortController()");
    expect(html).toContain("controller.abort(); }, 20000)");
    expect(html).toContain("analisis gagal tidak mengurangi kuota demo");
  });

  it("renders English and Chinese homepages and honors browser language", async () => {
    const english = await (await worker.fetch(new Request("http://localhost/?lang=en"), {} as any)).text();
    const chinese = await (await worker.fetch(new Request("http://localhost/", {
      headers: { "Accept-Language": "zh-CN,en;q=0.8" },
    }), {} as any)).text();

    expect(english).toContain("Try an Indonesian hook →");
    expect(english).toContain("Compare your original with 3 stronger versions");
    expect(chinese).toContain('<html lang="zh">');
    expect(chinese).toContain("试一段印尼语开头 →");
  });

  it("enables real checkout buttons only when Stripe is configured", async () => {
    const env = {
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_PRICE_CREATOR_IDR: "price_creator_idr",
      STRIPE_PRICE_STUDIO_IDR: "price_studio_idr",
    };
    const response = await worker.fetch(new Request("http://localhost/pricing?lang=en"), env as any);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('data-plan="creator"');
    expect(html).toContain('data-plan="studio"');
    expect(html).toContain("Buy Creator 30-day pass");
    expect(html).toContain("Buy Studio 30-day pass");
    expect(html).toContain('window.gbhTrack("upgrade_view")');
  });
});

describe("GET /install", () => {
  it("offers three honest integration paths without fake MCP or plugin links", async () => {
    const response = await worker.fetch(new Request("http://localhost/install?lang=zh"), {} as any);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("我用 Grok Bot");
    expect(html).toContain("我用其他 MCP 客户端");
    expect(html).toContain("我只要 API");
    expect(html).toContain("即将上线");
    expect(html).toContain("现已可用");
    expect(html).toContain("curl -X POST http://localhost/v1/app/invoke");
    expect(html).toContain('data-install-method="api"');
    expect(html).not.toContain("mcp://");
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
    expect(html).toContain("Effective 31 October 2026");
    expect(html).toContain("GrokBotHub");
  });

  it("discloses first-party events, retention, and script hashing", async () => {
    const response = await worker.fetch(new Request("http://localhost/privacy"), {} as any);
    const html = await response.text();

    expect(html).toContain("First-party product analytics");
    expect(html).toContain("demo_done");
    expect(html).toContain("first_real_call");
    expect(html).toContain("do not store script text in analytics records");
    expect(html).toContain("do not use third-party advertising or tracking scripts");
    expect(html).toContain("expire after 90 days");
  });
});
