import { INDONESIAN_EXAMPLE } from "./analysis-options";
import { analyticsScript } from "./events";
import { pricingScript, pricingStyles, renderPricingSection } from "./pricing-view";
import type { Language } from "./types";

const copy = {
  id: {
    navDemo: "Demo",
    navInstall: "Cara memasang",
    navPricing: "Harga",
    heroTitle: "Hook 3 detik pertama, dinilai dan ditulis ulang.",
    heroCopy: "Tempel opening drama pendek Anda. Dapatkan skor per dimensi dan 3 versi hook yang lebih kuat dalam Bahasa Indonesia, Inggris, atau Mandarin.",
    primary: "Coba hook Bahasa Indonesia →",
    demoTitle: "Bandingkan opening asli dengan 3 versi yang lebih kuat",
    demoNote: "Analisis Grok sungguhan · tanpa akun",
    inputLabel: "Opening drama pendek Anda",
    inputLanguage: "Bahasa input",
    autoDetect: "Deteksi otomatis",
    audience: "Target audiens",
    autoAudience: "Otomatis dari bahasa",
    platform: "Platform",
    outputLanguage: "Bahasa output",
    matchInput: "Ikuti bahasa input",
    defaultNote: "Bahasa Indonesia otomatis memakai ID Gen Z + TikTok",
    analyze: "Analisis hook saya →",
    limits: "3 panggilan demo per IP/jam · 20 global/hari",
    placeholder: "Skor, analisis per dimensi, dan 3 hook hasil tulis ulang akan tampil di sini.",
    score: "Skor hook / 100",
    original: "Opening asli",
    rewrites: "3 hook hasil tulis ulang",
    copy: "Salin",
    copied: "Tersalin",
    strengths: "Yang sudah kuat",
    suggestions: "Yang perlu diperkuat",
    audienceFit: "Kecocokan audiens",
    receipt: "ID hasil",
    analyzing: "Membaca opening dan menilai 3 detik pertama…",
    working: "Menganalisis dengan Grok…",
    slow: "Masih menganalisis kecocokan audiens dan pilihan tulis ulang…",
    verySlow: "Lebih lama dari biasanya. Proses akan berhenti pada 20 detik agar Anda dapat mencoba lagi.",
    timeout: "Analisis melebihi 20 detik. Silakan coba lagi; analisis gagal tidak mengurangi kuota demo.",
    failed: "Demo tidak dapat diselesaikan.",
    invalid: "Masukkan 10–1200 karakter dan periksa opsi analisis.",
    forbidden: "Jalankan demo dari halaman ini.",
    limited: "Batas demo tercapai. Coba lagi nanti atau minta akses produksi.",
    unavailable: "Grok sementara tidak tersedia. Silakan coba lagi.",
    installTitle: "Gunakan di alur kerja tim Anda",
    installCopy: "Lihat jalur Grok Bot, klien MCP, dan API. Integrasi yang belum tersedia ditandai dengan jelas.",
    installButton: "Lihat cara memasang →",
    dimensions: { conflict: "Konflik", identity_reveal: "Pengungkapan identitas", curiosity_gap: "Rasa penasaran", emotion: "Emosi" },
  },
  en: {
    navDemo: "Demo",
    navInstall: "Install",
    navPricing: "Pricing",
    heroTitle: "Your first 3 seconds, scored and rewritten.",
    heroCopy: "Paste a short-drama opening. Get dimension scores and 3 stronger hook rewrites in Indonesian, English, or Chinese.",
    primary: "Try an Indonesian hook →",
    demoTitle: "Compare your original with 3 stronger versions",
    demoNote: "Real Grok analysis · no sign-up",
    inputLabel: "Your short-drama opening",
    inputLanguage: "Input language",
    autoDetect: "Auto detect",
    audience: "Target audience",
    autoAudience: "Auto from language",
    platform: "Platform",
    outputLanguage: "Output language",
    matchInput: "Match input",
    defaultNote: "Indonesian input defaults to ID Gen Z + TikTok",
    analyze: "Analyze my hook →",
    limits: "3 demo calls per IP/hour · 20 global/day",
    placeholder: "Your score, dimension analysis, and 3 rewritten hooks will appear here.",
    score: "Hook score / 100",
    original: "Original opening",
    rewrites: "3 rewritten hooks",
    copy: "Copy",
    copied: "Copied",
    strengths: "What works",
    suggestions: "Make it stronger",
    audienceFit: "Audience fit",
    receipt: "Result ID",
    analyzing: "Reading your opening and scoring the first three seconds…",
    working: "Analyzing with Grok…",
    slow: "Still analyzing audience fit and rewrite options…",
    verySlow: "This is taking longer than usual. We will stop at 20 seconds so you can retry.",
    timeout: "The analysis exceeded 20 seconds. Please retry; failed analyses do not consume your demo limit.",
    failed: "The demo could not be completed.",
    invalid: "Enter between 10 and 1200 characters and check the analysis options.",
    forbidden: "Please run the demo from this page.",
    limited: "Demo limit reached. Try again later or request production access.",
    unavailable: "Grok is temporarily unavailable. Please try again.",
    installTitle: "Use this inside your team’s workflow",
    installCopy: "Review the Grok Bot, MCP client, and API paths. Unavailable integrations are clearly marked.",
    installButton: "View install options →",
    dimensions: { conflict: "Conflict", identity_reveal: "Identity reveal", curiosity_gap: "Curiosity gap", emotion: "Emotion" },
  },
  zh: {
    navDemo: "试玩",
    navInstall: "接入方式",
    navPricing: "价格",
    heroTitle: "前 3 秒钩子，直接评分并改写。",
    heroCopy: "粘贴短剧开场，获得分项评分和 3 条更强的钩子改写，支持印尼语、英语和中文输出。",
    primary: "试一段印尼语开头 →",
    demoTitle: "对比原开场与 3 条改写版本",
    demoNote: "真实 Grok 分析 · 无需注册",
    inputLabel: "你的短剧开场",
    inputLanguage: "输入语言",
    autoDetect: "自动识别",
    audience: "目标受众",
    autoAudience: "按语言自动选择",
    platform: "平台",
    outputLanguage: "输出语言",
    matchInput: "跟随输入语言",
    defaultNote: "印尼语输入默认使用 ID Gen Z + TikTok",
    analyze: "分析我的钩子 →",
    limits: "每个 IP 每小时 3 次 · 全球每天 20 次",
    placeholder: "这里会显示总分、分项评分和 3 条改写钩子。",
    score: "钩子评分 / 100",
    original: "原始开场",
    rewrites: "3 条改写钩子",
    copy: "复制",
    copied: "已复制",
    strengths: "已经有效的地方",
    suggestions: "可以加强的地方",
    audienceFit: "受众适配",
    receipt: "结果 ID",
    analyzing: "正在读取开场并评估前 3 秒…",
    working: "正在使用 Grok 分析…",
    slow: "仍在分析受众适配和改写方案…",
    verySlow: "这次比平时慢，20 秒后会自动停止，方便你重试。",
    timeout: "分析超过 20 秒。请重试；失败的分析不扣免费额度。",
    failed: "暂时无法完成试玩。",
    invalid: "请输入 10–1200 个字符，并检查分析选项。",
    forbidden: "请从本页面运行试玩。",
    limited: "免费额度已用完，请稍后再试或申请正式接入。",
    unavailable: "Grok 暂时不可用，请重试。",
    installTitle: "接入团队现有工作流",
    installCopy: "查看 Grok Bot、MCP 客户端和 API 三条路径，未上线的集成会明确标注。",
    installButton: "查看接入方式 →",
    dimensions: { conflict: "冲突", identity_reveal: "身份揭示", curiosity_gap: "好奇缺口", emotion: "情绪" },
  },
} as const;

interface HomeOptions {
  checkoutEnabled?: boolean;
  language?: Language;
  showPricing?: boolean;
}

export function renderHome(options: HomeOptions = {}): Response {
  const language = options.language ?? "id";
  const t = copy[language];
  const html = `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${t.heroCopy}">
  <title>GrokBotHub — ${t.heroTitle}</title>
  <style>
    :root { color-scheme:dark; --bg:#0b0e0d; --surface:#121615; --surface-2:#181d1b; --line:#2a322e; --text:#f0f4ed; --muted:#a8b4ab; --accent:#c7f36b; --accent-dark:#18220d; --mono:"SFMono-Regular",Consolas,"Liberation Mono",monospace; --sans:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; background:var(--bg); color:var(--text); font-family:var(--sans); -webkit-font-smoothing:antialiased; }
    a { color:inherit; text-decoration:none; }
    button,textarea,select { font:inherit; }
    .shell { width:min(1120px,calc(100% - 40px)); margin:0 auto; }
    .topbar { min-height:76px; display:flex; align-items:center; justify-content:space-between; gap:22px; border-bottom:1px solid var(--line); }
    .brand { font-weight:750; letter-spacing:-.03em; white-space:nowrap; }
    .brand span { color:var(--muted); font-weight:500; }
    .nav { display:flex; align-items:center; gap:22px; color:var(--muted); font-size:13px; }
    .nav a:hover { color:var(--text); }
    .languages { display:flex; gap:4px; padding-left:16px; border-left:1px solid var(--line); }
    .languages a { min-width:34px; padding:8px 6px; border:1px solid transparent; border-radius:5px; text-align:center; font:11px/1 var(--mono); }
    .languages a[aria-current="true"] { color:var(--accent); border-color:var(--line); }
    .hero { max-width:880px; padding:70px 0 54px; }
    h1 { margin:0; font-size:clamp(44px,6.5vw,76px); line-height:1.02; letter-spacing:-.055em; font-weight:720; }
    .hero-copy { max-width:680px; margin:24px 0 0; color:var(--muted); font-size:17px; line-height:1.7; }
    .hero-actions { margin-top:28px; }
    .button { display:inline-flex; align-items:center; justify-content:center; min-height:44px; padding:0 18px; border:1px solid var(--line); border-radius:6px; background:transparent; color:var(--text); font-size:13px; font-weight:650; cursor:pointer; }
    .button.primary { background:var(--accent); color:var(--accent-dark); border-color:var(--accent); }
    .button.secondary:hover { border-color:var(--muted); background:var(--surface); }
    .button:focus-visible,a:focus-visible,select:focus-visible,textarea:focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
    .button:disabled { cursor:wait; opacity:.65; }
    section { padding:54px 0 0; }
    .section-head { display:flex; align-items:end; justify-content:space-between; gap:20px; margin-bottom:22px; }
    h2 { margin:0; font-size:clamp(25px,4vw,34px); line-height:1.15; letter-spacing:-.035em; }
    .section-note { color:var(--muted); font:12px/1.5 var(--mono); white-space:nowrap; }
    .demo-shell { border:1px solid var(--line); border-radius:10px; overflow:hidden; background:var(--surface); }
    .demo-input { padding:28px; }
    .demo-input > label { display:block; margin-bottom:12px; font-size:14px; font-weight:650; }
    textarea { width:100%; min-height:150px; resize:vertical; padding:16px; border:1px solid var(--line); border-radius:6px; background:var(--bg); color:var(--text); font:15px/1.7 var(--sans); }
    .demo-options { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-top:16px; }
    .demo-options label { display:grid; gap:7px; color:var(--muted); font-size:12px; line-height:1.4; }
    .demo-options select { width:100%; min-height:42px; padding:8px 10px; border:1px solid var(--line); border-radius:5px; background:var(--bg); color:var(--text); font-size:12px; }
    .demo-meta { display:flex; justify-content:space-between; gap:12px; margin:12px 0 20px; color:var(--muted); font:11px/1.5 var(--mono); }
    .demo-limits { display:inline; margin-left:14px; color:var(--muted); font:11px/1.6 var(--mono); }
    .demo-output { min-width:0; padding:28px; border-top:1px solid var(--line); background:var(--surface-2); }
    #demo-result { color:var(--muted); font-size:14px; line-height:1.7; }
    .score-row { display:flex; align-items:end; gap:12px; margin-bottom:24px; }
    .score-value { color:var(--accent); font:54px/.9 var(--mono); letter-spacing:-.06em; }
    .score-label { color:var(--muted); font:11px/1.4 var(--mono); text-transform:uppercase; }
    .dimensions { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; margin:0 0 28px; background:var(--line); border:1px solid var(--line); }
    .dimension { padding:14px; background:var(--surface); }
    .dimension span { display:block; color:var(--muted); font-size:11px; line-height:1.4; }
    .dimension strong { display:block; margin-top:6px; color:var(--text); font:20px/1 var(--mono); }
    .comparison { display:grid; grid-template-columns:1fr 1.4fr; gap:22px; }
    .comparison h3 { margin:0 0 10px; color:var(--text); font-size:13px; }
    .original-text,.rewrite p { margin:0; white-space:pre-wrap; overflow-wrap:anywhere; color:var(--text); }
    .original-text { padding:16px; border-left:2px solid var(--muted); background:var(--surface); }
    .rewrite { display:grid; grid-template-columns:1fr auto; gap:12px; padding:16px 0; border-top:1px solid var(--line); }
    .rewrite:first-of-type { border-top:0; padding-top:0; }
    .rewrite .button { align-self:start; min-height:36px; padding:0 12px; }
    .result-group { margin-top:22px; }
    .result-group h3 { margin:0 0 8px; color:var(--text); font-size:13px; }
    .result-group ul { margin:0; padding-left:18px; }
    .result-group li + li { margin-top:6px; }
    .audience-fit { margin:22px 0 0; padding-top:18px; border-top:1px solid var(--line); }
    .audience-fit strong { display:block; margin-bottom:6px; color:var(--text); font-size:12px; }
    .ai-attribution,.receipt-id { margin:16px 0 0; padding-top:14px; border-top:1px solid var(--line); color:var(--muted); font:11px/1.6 var(--mono); overflow-wrap:anywhere; }
    .receipt-id { margin-top:0; border-top:0; padding-top:0; }
    .result-error { margin:0; padding:14px; border:1px solid #6d3a35; border-radius:6px; background:#251714; color:#ffb4a8; }
    .install-strip { display:flex; align-items:center; justify-content:space-between; gap:24px; margin-top:18px; padding:24px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
    .install-strip strong { font-size:15px; }
    .install-strip p { margin:7px 0 0; color:var(--muted); font-size:13px; line-height:1.6; }
    .install-strip .button { flex:none; }
    .footer { margin-top:64px; padding:28px 0 36px; border-top:1px solid var(--line); display:flex; justify-content:space-between; gap:20px; color:var(--muted); font-size:12px; }
    .footer-links { display:flex; flex-wrap:wrap; gap:18px; font-family:var(--mono); }
    .footer a:hover { color:var(--accent); }
    @media (max-width:900px) { .demo-options { grid-template-columns:1fr 1fr; } .comparison { grid-template-columns:1fr; } }
    @media (max-width:620px) {
      .shell { width:calc(100% - 28px); }
      .topbar { align-items:flex-start; flex-direction:column; padding:18px 0; gap:14px; }
      .nav { width:100%; justify-content:space-between; gap:12px; }
      .languages { padding-left:10px; }
      .hero { padding:44px 0 38px; }
      h1 { font-size:clamp(38px,11vw,52px); }
      .hero-copy { font-size:15px; }
      .section-head,.install-strip,.footer { align-items:flex-start; flex-direction:column; }
      .section-note { white-space:normal; }
      .demo-input,.demo-output { padding:22px 20px; }
      .demo-meta { flex-direction:column; }
      .demo-limits { display:block; margin:12px 0 0; }
      .dimensions { grid-template-columns:1fr 1fr; }
      .rewrite { grid-template-columns:1fr; }
      .rewrite .button { justify-self:start; }
    }
    @media (prefers-reduced-motion:reduce) { html { scroll-behavior:auto; } }
    ${options.showPricing ? pricingStyles : ""}
  </style>
</head>
<body>
  <header class="shell topbar">
    <a class="brand" href="/?lang=${language}">GrokBotHub <span>/ Hook Tools</span></a>
    <nav class="nav" aria-label="Main navigation">
      <a href="#demo">${t.navDemo}</a>
      <a href="/install?lang=${language}" data-install-link>${t.navInstall}</a>
      <a href="/pricing?lang=${language}">${t.navPricing}</a>
      <div class="languages" aria-label="Language">
        <a href="${options.showPricing ? "/pricing" : "/"}?lang=id" aria-current="${language === "id"}">ID</a>
        <a href="${options.showPricing ? "/pricing" : "/"}?lang=en" aria-current="${language === "en"}">EN</a>
        <a href="${options.showPricing ? "/pricing" : "/"}?lang=zh" aria-current="${language === "zh"}">中文</a>
      </div>
    </nav>
  </header>
  <main class="shell">
    <section class="hero">
      <h1>${t.heroTitle}</h1>
      <p class="hero-copy">${t.heroCopy}</p>
      <div class="hero-actions"><a class="button primary" href="#demo">${t.primary}</a></div>
    </section>
    <section id="demo">
      <div class="section-head"><h2>${t.demoTitle}</h2><div class="section-note">${t.demoNote}</div></div>
      <div class="demo-shell">
        <form id="demo-form" class="demo-input">
          <label for="script-text">${t.inputLabel}</label>
          <textarea id="script-text" name="script_text" minlength="10" maxlength="1200" required>${INDONESIAN_EXAMPLE}</textarea>
          <div class="demo-options" aria-label="Analysis options">
            <label>${t.inputLanguage}<select id="input-language" name="input_language"><option value="auto" selected>${t.autoDetect}</option><option value="id">Bahasa Indonesia</option><option value="en">English</option><option value="zh">中文</option></select></label>
            <label>${t.audience}<select id="target-audience" name="target_audience"><option value="" selected>${t.autoAudience}</option><option value="ID_GenZ">Indonesia · Gen Z</option><option value="ID_Millennial">Indonesia · Millennial</option><option value="US_GenZ">US · Gen Z</option><option value="CN_GenZ">China · Gen Z</option></select></label>
            <label>${t.platform}<select id="demo-platform" name="platform"><option value="tiktok" selected>TikTok</option><option value="reels">Reels</option><option value="youtube_shorts">YouTube Shorts</option><option value="dramabox">DramaBox</option><option value="shortmax">ShortMax</option><option value="reelshort">ReelShort</option></select></label>
            <label>${t.outputLanguage}<select id="output-language" name="output_language"><option value="" selected>${t.matchInput}</option><option value="id">Bahasa Indonesia</option><option value="en">English</option><option value="zh">中文</option></select></label>
          </div>
          <div class="demo-meta"><span>${t.defaultNote}</span><span id="character-count">0 / 1200</span></div>
          <button id="demo-submit" class="button primary" type="submit">${t.analyze}</button>
          <p class="demo-limits">${t.limits}</p>
        </form>
        <div class="demo-output" aria-live="polite">
          <div id="demo-result"><div>${t.placeholder}</div></div>
        </div>
      </div>
      <div class="install-strip">
        <div><strong>${t.installTitle}</strong><p>${t.installCopy}</p></div>
        <a class="button secondary" href="/install?lang=${language}" data-install-link>${t.installButton}</a>
      </div>
    </section>
    ${options.showPricing ? renderPricingSection(options.checkoutEnabled ?? false, language) : ""}
  </main>
  <footer class="shell footer">
    <div>GrokBotHub · AI-assisted hook analysis</div>
    <div class="footer-links"><a href="/health">/health</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/refunds">Refunds</a><a href="https://github.com/vfvincentwong2026/grok-bot-hub">GitHub ↗</a></div>
  </footer>
  <script>
    ${analyticsScript}
    ${options.showPricing ? pricingScript : ""}
    (function setupDemo() {
      const form = document.getElementById("demo-form");
      const input = document.getElementById("script-text");
      const count = document.getElementById("character-count");
      const button = document.getElementById("demo-submit");
      const result = document.getElementById("demo-result");
      if (!form || !input || !count || !button || !result) return;
      const labels = ${JSON.stringify(t)};
      const optionIds = ["input-language", "target-audience", "demo-platform", "output-language"];

      window.gbhTrack("landing_view");
      document.querySelectorAll("[data-install-link]").forEach(function (link) {
        link.addEventListener("click", function () { window.gbhTrack("install_click"); });
      });

      try {
        const saved = JSON.parse(localStorage.getItem("gbh_demo_options") || "null");
        if (saved && typeof saved === "object") {
          optionIds.forEach(function (id) {
            const select = document.getElementById(id);
            if (saved[id] !== undefined && select.querySelector('option[value="' + saved[id] + '"]')) select.value = saved[id];
          });
        }
      } catch {}
      function saveOptions() {
        try {
          const values = {};
          optionIds.forEach(function (id) { values[id] = document.getElementById(id).value; });
          localStorage.setItem("gbh_demo_options", JSON.stringify(values));
        } catch {}
      }
      optionIds.forEach(function (id) { document.getElementById(id).addEventListener("change", saveOptions); });

      function updateCount() { count.textContent = input.value.length + " / 1200"; }
      function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = String(text);
        return node;
      }
      function appendList(title, items) {
        if (!Array.isArray(items) || !items.length) return;
        const group = element("div", "result-group");
        group.appendChild(element("h3", "", title));
        const list = document.createElement("ul");
        items.forEach(function (item) { list.appendChild(element("li", "", item)); });
        group.appendChild(list);
        result.appendChild(group);
      }
      async function copyRewrite(text, copyButton) {
        try {
          await navigator.clipboard.writeText(text);
          copyButton.textContent = labels.copied;
          window.gbhTrack("rewrite_copy");
          setTimeout(function () { copyButton.textContent = labels.copy; }, 1600);
        } catch {
          copyButton.textContent = labels.failed;
        }
      }
      function renderAnalysis(analysis, attribution) {
        result.replaceChildren();
        const row = element("div", "score-row");
        row.append(element("div", "score-value", analysis.hook_score), element("div", "score-label", labels.score));
        result.appendChild(row);

        const dimensions = element("div", "dimensions");
        ["conflict", "identity_reveal", "curiosity_gap", "emotion"].forEach(function (key) {
          const item = element("div", "dimension");
          item.append(element("span", "", labels.dimensions[key]), element("strong", "", analysis.dimensions[key]));
          dimensions.appendChild(item);
        });
        result.appendChild(dimensions);

        const comparison = element("div", "comparison");
        const original = element("div");
        original.append(element("h3", "", labels.original), element("div", "original-text", input.value));
        const rewrites = element("div");
        rewrites.appendChild(element("h3", "", labels.rewrites));
        analysis.rewritten_hooks.forEach(function (text) {
          const article = element("article", "rewrite");
          const copyButton = element("button", "button secondary", labels.copy);
          copyButton.type = "button";
          copyButton.addEventListener("click", function () { copyRewrite(text, copyButton); });
          article.append(element("p", "", text), copyButton);
          rewrites.appendChild(article);
        });
        comparison.append(original, rewrites);
        result.appendChild(comparison);
        appendList(labels.strengths, analysis.strengths);
        appendList(labels.suggestions, analysis.suggestions);
        const fit = element("p", "audience-fit");
        fit.append(element("strong", "", labels.audienceFit), document.createTextNode(analysis.audience_fit));
        result.appendChild(fit);
        result.appendChild(element("p", "receipt-id", labels.receipt + ": " + analysis.receipt_id));
        if (attribution) result.appendChild(element("p", "ai-attribution", attribution));
      }

      updateCount();
      input.addEventListener("input", updateCount);
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!form.reportValidity()) return;
        saveOptions();
        window.gbhTrack("demo_start");
        const controller = new AbortController();
        const slowTimer = setTimeout(function () { result.textContent = labels.slow; }, 5000);
        const verySlowTimer = setTimeout(function () { result.textContent = labels.verySlow; }, 12000);
        const timeoutTimer = setTimeout(function () { controller.abort(); }, 20000);
        button.disabled = true;
        button.textContent = labels.working;
        form.setAttribute("aria-busy", "true");
        result.textContent = labels.analyzing;
        try {
          const payload = {
            script_text: input.value,
            input_language: document.getElementById("input-language").value,
            target_audience: document.getElementById("target-audience").value,
            output_language: document.getElementById("output-language").value,
            platform: document.getElementById("demo-platform").value
          };
          ["input_language", "target_audience", "output_language"].forEach(function (key) { if (!payload[key]) delete payload[key]; });
          const response = await fetch("/v1/demo/invoke", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(payload), signal:controller.signal });
          const data = await response.json().catch(function () { return null; });
          if (!response.ok || !data?.ok) {
            const messages = { 400:labels.invalid, 403:labels.forbidden, 429:labels.limited, 502:labels.unavailable };
            throw new Error(messages[response.status] || data?.error || labels.failed);
          }
          renderAnalysis(data.analysis, data.attribution);
        } catch (error) {
          const message = error instanceof Error && error.name === "AbortError" ? labels.timeout : error instanceof Error ? error.message : labels.failed;
          result.replaceChildren(element("p", "result-error", message));
        } finally {
          clearTimeout(slowTimer);
          clearTimeout(verySlowTimer);
          clearTimeout(timeoutTimer);
          button.disabled = false;
          button.textContent = labels.analyze;
          form.removeAttribute("aria-busy");
        }
      });
    })();
    (function trackUpgradeView() {
      const pricing = document.getElementById("pricing");
      if (!pricing || !("IntersectionObserver" in window)) return;
      let tracked = false;
      const observer = new IntersectionObserver(function (entries) {
        if (!tracked && entries.some(function (entry) { return entry.isIntersecting; })) {
          tracked = true;
          window.gbhTrack("upgrade_view");
          observer.disconnect();
        }
      }, { threshold:0.2 });
      observer.observe(pricing);
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" },
  });
}
