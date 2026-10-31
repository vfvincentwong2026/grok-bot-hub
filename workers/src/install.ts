import { analyticsScript } from "./events";
import type { Language } from "./types";

const copy = {
  id: {
    title: "Pasang di alur kerja Anda",
    intro: "Pilih jalur yang sesuai. Hanya integrasi yang benar-benar tersedia yang ditandai dapat digunakan.",
    grok: "Saya memakai Grok Bot",
    grokBody: "Plugin dan template bot sedang disiapkan. Belum ada paket yang dapat dipasang.",
    mcp: "Saya memakai klien MCP lain",
    mcpBody: "Endpoint MCP Streamable HTTP tersedia tanpa API key. Kuota gratis dibagi dengan demo web: 3 analisis per IP per jam dan 20 analisis global per hari.",
    api: "Saya hanya membutuhkan API",
    apiBody: "API analisis hook berbayar sudah tersedia. Gunakan API key Anda; jangan membagikannya di sisi klien.",
    soon: "Segera hadir",
    available: "Tersedia sekarang",
    docs: "Buka dokumentasi API",
    mcpDocs: "Buka panduan MCP",
    example: "Contoh permintaan",
    mcpConfig: "Contoh konfigurasi MCP",
    back: "Kembali ke demo",
  },
  en: {
    title: "Install in your workflow",
    intro: "Choose your path. Only integrations that actually work are marked as available.",
    grok: "I use Grok Bot",
    grokBody: "The plugin and bot templates are being prepared. There is no installable package yet.",
    mcp: "I use another MCP client",
    mcpBody: "The Streamable HTTP MCP endpoint is available without an API key. Free calls share the web demo quota: 3 analyses per IP each hour and 20 analyses globally per day.",
    api: "I only need the API",
    apiBody: "The paid hook-analysis API is available. Use your API key and never expose it in client-side code.",
    soon: "Coming soon",
    available: "Available now",
    docs: "Open API documentation",
    mcpDocs: "Open MCP guide",
    example: "Example request",
    mcpConfig: "Example MCP configuration",
    back: "Back to the demo",
  },
  zh: {
    title: "接入你的现有工作流",
    intro: "选择你的接入路径。只有真实可用的集成才会标为已上线。",
    grok: "我用 Grok Bot",
    grokBody: "插件和 Bot 模板正在准备中，目前还没有可安装包。",
    mcp: "我用其他 MCP 客户端",
    mcpBody: "Streamable HTTP MCP 端点已上线，无需 API key。免费额度与网页试玩共用：每 IP 每小时 3 次，全局每天 20 次。",
    api: "我只要 API",
    apiBody: "付费钩子分析 API 已可用。请使用自己的 API key，且不要在前端暴露。",
    soon: "即将上线",
    available: "现已可用",
    docs: "打开 API 文档",
    mcpDocs: "打开 MCP 指南",
    example: "请求示例",
    mcpConfig: "MCP 配置示例",
    back: "返回试玩",
  },
} as const;

export function resolvePageLanguage(value: string | null): Language {
  const language = value?.toLowerCase() ?? "";
  if (language === "zh" || language.startsWith("zh-")) return "zh";
  if (language === "en" || language.startsWith("en-")) return "en";
  return "id";
}

export function renderInstallPage(language: Language, origin: string): Response {
  const t = copy[language];
  const html = `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${t.intro}">
  <link rel="icon" href="data:,">
  <title>${t.title} — GrokBotHub</title>
  <style>
    :root { color-scheme: dark; --bg:#0b0e0d; --surface:#121615; --line:#2a322e; --text:#f0f4ed; --muted:#a8b4ab; --accent:#c7f36b; --mono:"SFMono-Regular",Consolas,monospace; --sans:Inter,ui-sans-serif,system-ui,sans-serif; }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--bg); color:var(--text); font-family:var(--sans); }
    a { color:inherit; }
    .shell { width:min(980px,calc(100% - 40px)); margin:0 auto; }
    .topbar { min-height:76px; display:flex; align-items:center; justify-content:space-between; gap:20px; border-bottom:1px solid var(--line); }
    .brand { font-weight:750; text-decoration:none; }
    .languages { display:flex; gap:6px; }
    .languages a { padding:8px 10px; color:var(--muted); border:1px solid transparent; border-radius:5px; font:12px/1 var(--mono); text-decoration:none; }
    .languages a[aria-current="true"] { color:var(--accent); border-color:var(--line); }
    main { padding:64px 0; }
    h1 { max-width:720px; margin:0; font-size:clamp(38px,7vw,68px); line-height:1.03; letter-spacing:-.05em; }
    .intro { max-width:650px; margin:22px 0 40px; color:var(--muted); font-size:17px; line-height:1.7; }
    .paths { border-top:1px solid var(--line); }
    .path { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:20px; padding:28px 0; border-bottom:1px solid var(--line); }
    .path > div { min-width:0; }
    .path h2 { margin:0 0 10px; font-size:21px; }
    .path p { max-width:660px; margin:0; color:var(--muted); font-size:14px; line-height:1.7; }
    .status { align-self:start; padding:6px 8px; border:1px solid var(--line); border-radius:4px; color:var(--muted); font:11px/1 var(--mono); white-space:nowrap; }
    .status.available { color:var(--accent); }
    pre { max-width:100%; margin:24px 0 0; padding:18px; overflow:auto; background:var(--surface); border:1px solid var(--line); border-radius:7px; color:#d9e4db; font:12px/1.7 var(--mono); }
    .actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:26px; }
    .button { display:inline-flex; align-items:center; min-height:44px; padding:0 16px; border:1px solid var(--line); border-radius:6px; color:var(--text); font-size:13px; font-weight:650; text-decoration:none; }
    .button.primary { background:var(--accent); border-color:var(--accent); color:#18220d; }
    @media (max-width:560px) { .shell { width:calc(100% - 28px); } main { padding:44px 0; } .path { grid-template-columns:1fr; gap:12px; } .status { justify-self:start; } }
  </style>
</head>
<body>
  <header class="shell topbar">
    <a class="brand" href="/?lang=${language}">GrokBotHub</a>
    <nav class="languages" aria-label="Language">
      <a href="/install?lang=id" aria-current="${language === "id"}">ID</a>
      <a href="/install?lang=en" aria-current="${language === "en"}">EN</a>
      <a href="/install?lang=zh" aria-current="${language === "zh"}">中文</a>
    </nav>
  </header>
  <main class="shell">
    <h1>${t.title}</h1>
    <p class="intro">${t.intro}</p>
    <div class="paths">
      <section class="path">
        <div><h2>${t.grok}</h2><p>${t.grokBody}</p></div>
        <span class="status">${t.soon}</span>
      </section>
      <section class="path">
        <div>
          <h2>${t.mcp}</h2><p>${t.mcpBody}</p>
          <pre>${t.mcpConfig}\n\n{\n  "mcpServers": {\n    "grok-bot-hub": {\n      "url": "<span data-request-origin>${origin}</span>/mcp"\n    }\n  }\n}</pre>
          <div class="actions"><a class="button primary" data-install-method="mcp" href="https://github.com/vfvincentwong2026/grok-bot-hub/blob/main/docs/mcp.md">${t.mcpDocs}</a></div>
        </div>
        <span class="status available">${t.available}</span>
      </section>
      <section class="path">
        <div>
          <h2>${t.api}</h2><p>${t.apiBody}</p>
          <pre>${t.example}\n\ncurl -X POST <span data-request-origin>${origin}</span>/v1/app/invoke \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"script_text":"Kamu bilang aku hanya seorang pelayan, tetapi aku adalah pewaris yang sebenarnya.","platform":"tiktok"}'</pre>
          <div class="actions"><a class="button primary" data-install-method="api" href="https://github.com/vfvincentwong2026/grok-bot-hub#api">${t.docs}</a></div>
        </div>
        <span class="status available">${t.available}</span>
      </section>
    </div>
    <div class="actions"><a class="button" href="/?lang=${language}#demo">← ${t.back}</a></div>
  </main>
  <script>${analyticsScript}
    document.querySelectorAll("[data-request-origin]").forEach(function (element) {
      element.textContent = window.location.origin;
    });
    document.querySelectorAll("[data-install-method]").forEach(function (link) {
      link.addEventListener("click", function () { window.gbhTrack("install_click", { install_method: link.dataset.installMethod }); });
    });
  </script>
</body>
</html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" } });
}
