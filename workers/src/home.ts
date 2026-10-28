import { pricingScript, pricingStyles, renderPricingSection } from "./pricing-view";
import { getAgentCards, listBots } from "./registry";
import type { AgentCard } from "./types";

export function renderHome(options: { checkoutEnabled: boolean } = { checkoutEnabled: false }): Response {
  const bots = listBots();
  const cards = getAgentCards() as Record<string, AgentCard>;

  const botCards = bots
    .map(
      (bot, index) => `
        <article class="bot-card">
          <div class="bot-index">0${index + 1}</div>
          <div class="bot-body">
            <div class="bot-id">${bot.id}</div>
            <h3>${bot.name}</h3>
            <p>${bot.description}</p>
            <div class="skill-row">${bot.skills.map((skill) => `<code>${skill}</code>`).join("")}</div>
          </div>
        </article>`,
    )
    .join("");

  const agentCards = bots
    .map((bot) => {
      const card = cards[bot.id]!;
      const skills = card.skills
        .map(
          (skill) => `
            <li>
              <strong>${skill.name}</strong>
              <span>${skill.description}</span>
              <div class="tag-row">${(skill.tags ?? []).map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
            </li>`,
        )
        .join("");
      return `
        <article class="agent-card">
          <div class="agent-card-head">
            <div>
              <div class="bot-id">${bot.id}</div>
              <h3>${card.name}</h3>
            </div>
            <span class="version">v${card.version}</span>
          </div>
          <p>${card.description}</p>
          <ul class="skill-list">${skills}</ul>
        </article>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="GrokBotHub — an edge-native A2A registry and live leaderboard for xAI Grok micro-agents.">
  <title>GrokBotHub — Agent Registry</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b0e0d;
      --surface: #121615;
      --surface-2: #181d1b;
      --line: #2a322e;
      --text: #f0f4ed;
      --muted: #9aa79f;
      --accent: #c7f36b;
      --accent-dark: #18220d;
      --mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      --sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: var(--sans);
      -webkit-font-smoothing: antialiased;
    }
    a { color: inherit; text-decoration: none; }
    code { font-family: var(--mono); }
    .shell { width: min(1180px, calc(100% - 40px)); margin: 0 auto; }
    .topbar {
      min-height: 76px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--line);
      gap: 24px;
    }
    .brand { display: flex; align-items: center; gap: 12px; font-weight: 750; letter-spacing: -0.03em; }
    .brand-mark { width: 30px; height: 30px; color: var(--accent); }
    .brand span { color: var(--muted); font-weight: 500; }
    .nav { display: flex; align-items: center; gap: 26px; color: var(--muted); font-size: 13px; }
    .nav a:hover { color: var(--text); }
    .nav .api-link { color: var(--accent); font-family: var(--mono); }
    .hero {
      position: relative;
      padding: 88px 0 64px;
      border-bottom: 1px solid var(--line);
      overflow: hidden;
    }
    .hero::after {
      content: "";
      position: absolute;
      width: 420px;
      height: 420px;
      right: -120px;
      top: -180px;
      border: 1px solid #36432b;
      border-radius: 50%;
      box-shadow: 0 0 0 64px #11170f, 0 0 0 65px #293421, 0 0 0 128px #0e130d, 0 0 0 129px #202a1a;
      pointer-events: none;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      color: var(--accent);
      font: 11px/1.2 var(--mono);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 16px #c7f36b88; }
    h1 { max-width: 790px; margin: 24px 0 22px; font-size: clamp(48px, 7vw, 88px); line-height: 0.98; letter-spacing: -0.065em; font-weight: 720; }
    h1 span { color: var(--muted); }
    .hero-copy { max-width: 620px; margin: 0; color: var(--muted); font-size: 17px; line-height: 1.7; }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
    .button { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 18px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px; font-weight: 650; }
    .button.primary { background: var(--accent); color: var(--accent-dark); border-color: var(--accent); }
    .button.secondary:hover { border-color: var(--muted); background: var(--surface); }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 1px solid var(--line); }
    .stat { padding: 26px 0; }
    .stat + .stat { border-left: 1px solid var(--line); padding-left: 28px; }
    .stat-value { font: 26px/1 var(--mono); color: var(--text); }
    .stat-label { margin-top: 9px; color: var(--muted); font-size: 12px; }
    section { padding: 68px 0 0; }
    .section-head { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 26px; }
    .section-kicker { color: var(--accent); font: 11px/1.2 var(--mono); letter-spacing: 0.12em; text-transform: uppercase; }
    h2 { margin: 10px 0 0; font-size: 30px; letter-spacing: -0.04em; }
    .section-note { color: var(--muted); font: 12px/1.5 var(--mono); }
    .bot-grid { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
    .bot-card { min-height: 284px; background: var(--surface); }
    .bot-card + .bot-card { border-left: 1px solid var(--line); }
    .bot-index { padding: 20px 24px; border-bottom: 1px solid var(--line); color: var(--muted); font: 11px/1 var(--mono); }
    .bot-body { padding: 26px 24px; }
    .bot-id { color: var(--muted); font: 11px/1.5 var(--mono); overflow-wrap: anywhere; }
    h3 { margin: 12px 0; font-size: 20px; letter-spacing: -0.025em; }
    .bot-body p, .agent-card > p { min-height: 68px; margin: 0; color: var(--muted); font-size: 14px; line-height: 1.65; }
    .skill-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
    .skill-row code { padding: 6px 8px; background: var(--accent-dark); color: var(--accent); border-radius: 4px; font-size: 11px; }
    .agent-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .agent-card { padding: 24px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }
    .agent-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .version { flex: none; padding: 5px 8px; border: 1px solid var(--line); border-radius: 4px; color: var(--muted); font: 11px/1 var(--mono); }
    .skill-list { list-style: none; padding: 18px 0 0; margin: 22px 0 0; border-top: 1px solid var(--line); }
    .skill-list li { display: grid; gap: 8px; }
    .skill-list strong { font-size: 13px; }
    .skill-list li > span { color: var(--muted); font-size: 13px; line-height: 1.6; }
    .tag-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 5px; }
    .tag { color: #bdc8c0; font: 10px/1 var(--mono); padding: 5px 7px; background: var(--surface-2); border-radius: 3px; }
    .demo-shell { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; background: var(--surface); }
    .demo-input, .demo-output { padding: 28px; }
    .demo-input { border-right: 1px solid var(--line); }
    .demo-input label { display: block; margin-bottom: 14px; font-size: 14px; font-weight: 650; }
    .demo-input textarea { width: 100%; min-height: 210px; resize: vertical; padding: 16px; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); color: var(--text); font: 14px/1.7 var(--sans); }
    .demo-input textarea:focus { outline: 2px solid var(--accent); outline-offset: 2px; }
    .demo-meta { display: flex; justify-content: space-between; gap: 12px; margin: 10px 0 20px; color: var(--muted); font: 11px/1.5 var(--mono); }
    .demo-input .button { cursor: pointer; }
    .demo-input .button:disabled { cursor: wait; opacity: 0.65; }
    .demo-limits { margin: 14px 0 0; color: var(--muted); font: 11px/1.6 var(--mono); }
    .demo-output { min-width: 0; background: var(--surface-2); }
    .output-label { padding-bottom: 16px; border-bottom: 1px solid var(--line); color: var(--accent); font: 11px/1.2 var(--mono); letter-spacing: 0.12em; text-transform: uppercase; }
    #demo-result { padding-top: 22px; color: var(--muted); font-size: 14px; line-height: 1.7; }
    .demo-placeholder { max-width: 360px; }
    .score-row { display: flex; align-items: end; gap: 12px; margin-bottom: 22px; }
    .score-value { color: var(--accent); font: 54px/0.9 var(--mono); letter-spacing: -0.06em; }
    .score-label { color: var(--muted); font: 11px/1.4 var(--mono); text-transform: uppercase; }
    .result-group { margin-top: 18px; }
    .result-group h4 { margin: 0 0 8px; color: var(--text); font-size: 12px; }
    .result-group ul { margin: 0; padding-left: 18px; }
    .result-group li + li { margin-top: 6px; }
    .audience-fit { margin: 20px 0 0; padding-top: 18px; border-top: 1px solid var(--line); }
    .audience-fit strong { display: block; margin-bottom: 6px; color: var(--text); font-size: 12px; }
    .result-text { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--text); }
    .result-error { margin: 0; padding: 14px; border: 1px solid #6d3a35; border-radius: 6px; background: #251714; color: #ffb4a8; }
    .demo-conversion { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-top: 16px; padding: 22px 24px; border: 1px solid var(--line); border-radius: 10px; }
    .demo-conversion strong { font-size: 14px; }
    .demo-conversion p { margin: 7px 0 0; color: var(--muted); font-size: 13px; line-height: 1.6; }
    .demo-conversion .button { flex: none; }
    .leaderboard { margin-top: 68px; padding: 34px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }
    .leaderboard .section-head { margin-bottom: 22px; }
    .live-state { display: flex; align-items: center; gap: 8px; color: var(--muted); font: 11px/1.4 var(--mono); }
    .empty-state { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 24px 0 4px; border-top: 1px solid var(--line); }
    .empty-title { font-size: 15px; font-weight: 650; }
    .empty-copy { margin-top: 7px; color: var(--muted); font-size: 13px; line-height: 1.6; }
    .empty-code { color: var(--accent); font: 12px/1.5 var(--mono); }
    .metrics-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .metrics-table th, .metrics-table td { padding: 14px 10px; border-top: 1px solid var(--line); text-align: left; }
    .metrics-table th { color: var(--muted); font: 10px/1.3 var(--mono); text-transform: uppercase; letter-spacing: 0.08em; }
    .footer { margin-top: 76px; padding: 30px 0 36px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; gap: 20px; color: var(--muted); font-size: 12px; }
    .footer-links { display: flex; flex-wrap: wrap; gap: 18px; font-family: var(--mono); }
    .footer a:hover { color: var(--accent); }
    @media (max-width: 860px) {
      .bot-grid, .agent-grid, .demo-shell { grid-template-columns: 1fr; }
      .bot-card + .bot-card { border-left: 0; border-top: 1px solid var(--line); }
      .bot-card { min-height: auto; }
      .bot-body p, .agent-card > p { min-height: auto; }
      .demo-input { border-right: 0; border-bottom: 1px solid var(--line); }
      .nav a:not(.api-link) { display: none; }
      .hero::after { opacity: 0.45; }
    }
    @media (max-width: 560px) {
      .shell { width: min(100% - 28px, 1180px); }
      .hero { padding: 58px 0 44px; }
      h1 { font-size: 48px; }
      .hero-copy { font-size: 15px; }
      .stats { grid-template-columns: 1fr; }
      .stat + .stat { border-left: 0; border-top: 1px solid var(--line); padding-left: 0; }
      .section-head, .empty-state, .footer, .demo-conversion { align-items: flex-start; flex-direction: column; }
      .demo-input, .demo-output { padding: 22px 20px; }
      .leaderboard { padding: 24px 20px; }
      .metrics-table { min-width: 520px; }
      .table-wrap { overflow-x: auto; }
    }
    @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
    ${pricingStyles}
  </style>
</head>
<body>
  <header class="shell topbar">
    <a class="brand" href="/" aria-label="GrokBotHub home">
      <svg class="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M7 8.5 16 3l9 5.5v10L16 24l-9-5.5v-10Z" stroke="currentColor" stroke-width="1.5"/>
        <path d="m7 8.5 9 5.4 9-5.4M16 14v10M11.5 26.5 16 29l4.5-2.5" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="16" cy="14" r="2.5" fill="currentColor"/>
      </svg>
      <div>GrokBotHub <span>/ A2A Registry</span></div>
    </a>
    <nav class="nav" aria-label="Main navigation">
      <a href="#demo">Live demo</a>
      <a href="#pricing">Pricing</a>
      <a href="#bots">Bots</a>
      <a href="#agent-cards">Agent Cards</a>
      <a href="#leaderboard">Leaderboard</a>
      <a class="api-link" href="/health">API STATUS ↗</a>
    </nav>
  </header>

  <main class="shell">
    <section class="hero">
      <div class="eyebrow"><span class="pulse"></span> Edge network · operational</div>
      <h1>Agents, connected.<br><span>Performance, visible.</span></h1>
      <p class="hero-copy">An edge-native registry for specialized Grok micro-agents. Discover capabilities, inspect A2A contracts, and monitor invocation performance from one Cloudflare Worker.</p>
      <div class="hero-actions">
        <a class="button primary" href="#demo">Try the live demo →</a>
        <a class="button secondary" href="/.well-known/agent-card.json">Raw agent cards</a>
      </div>
    </section>

    <div class="stats" aria-label="Registry summary">
      <div class="stat"><div class="stat-value">03</div><div class="stat-label">Registered Grok bots</div></div>
      <div class="stat"><div class="stat-value">A2A-v1</div><div class="stat-label">Standard invocation protocol</div></div>
      <div class="stat"><div class="stat-value">Edge</div><div class="stat-label">Cloudflare Workers + KV</div></div>
    </div>

    <section id="demo">
      <div class="section-head">
        <div><div class="section-kicker">01 / Live demo</div><h2>Test your opening hook</h2></div>
        <div class="section-note">Real Grok analysis · no sign-up</div>
      </div>
      <div class="demo-shell">
        <form id="demo-form" class="demo-input">
          <label for="script-text">Paste the opening of your short drama</label>
          <textarea id="script-text" name="script_text" minlength="10" maxlength="1200" required>“You called me a maid?” Elena ripped off her apron at the billionaire’s wedding. “Then why does your prenup name me as the real heir?”</textarea>
          <div class="demo-meta"><span>English · Reels · US Gen Z</span><span id="character-count">0 / 1200</span></div>
          <button id="demo-submit" class="button primary" type="submit">Analyze my hook →</button>
          <p class="demo-limits">3 demo calls per IP/hour · 20 global/day</p>
        </form>
        <div class="demo-output" aria-live="polite" aria-atomic="true">
          <div class="output-label">Grok analysis</div>
          <div id="demo-result"><div class="demo-placeholder">Your hook score, strengths, and specific rewrites will appear here after a real API call.</div></div>
        </div>
      </div>
      <div class="demo-conversion">
        <div><strong>Need this inside your writers’ room?</strong><p>Connect your scripts, brand rules, and review workflow to a production API.</p></div>
        <a class="button secondary" href="#pricing">View API plans →</a>
      </div>
    </section>

    ${renderPricingSection(options.checkoutEnabled)}

    <section id="bots">
      <div class="section-head">
        <div><div class="section-kicker">03 / Registry</div><h2>Specialized micro-agents</h2></div>
        <a class="section-note" href="/v1/bots">GET /v1/bots ↗</a>
      </div>
      <div class="bot-grid">${botCards}</div>
    </section>

    <section id="agent-cards">
      <div class="section-head">
        <div><div class="section-kicker">04 / Discovery</div><h2>Agent Card contracts</h2></div>
        <a class="section-note" href="/.well-known/agent-card.json">.well-known/agent-card.json ↗</a>
      </div>
      <div class="agent-grid">${agentCards}</div>
    </section>

    <section id="leaderboard" class="leaderboard" aria-live="polite">
      <div class="section-head">
        <div><div class="section-kicker">05 / Telemetry</div><h2>Live leaderboard</h2></div>
        <div class="live-state"><span class="pulse"></span><span id="updated-at">Connecting to KV snapshot</span></div>
      </div>
      <div id="leaderboard-content">
        <div class="empty-state">
          <div><div class="empty-title">Reading the latest snapshot…</div><div class="empty-copy">The registry is online. Fetching edge metrics now.</div></div>
        </div>
      </div>
    </section>
  </main>

  <footer class="shell footer">
    <div>GrokBotHub · Edge-native A2A infrastructure</div>
    <div class="footer-links">
      <a href="/health">/health</a>
      <a href="/v1/bots">/v1/bots</a>
      <a href="/v1/leaderboard">/v1/leaderboard</a>
      <a href="/terms">Terms</a>
      <a href="/privacy">Privacy</a>
      <a href="/refunds">Refunds</a>
      <a href="https://github.com/vfvincentwong2026/grok-bot-hub">GitHub ↗</a>
    </div>
  </footer>

  <script>
    ${pricingScript}

    (function setupDemo() {
      const form = document.getElementById("demo-form");
      const input = document.getElementById("script-text");
      const count = document.getElementById("character-count");
      const button = document.getElementById("demo-submit");
      const result = document.getElementById("demo-result");
      if (!form || !input || !count || !button || !result) return;

      function updateCount() {
        count.textContent = input.value.length + " / 1200";
      }

      function appendList(title, items) {
        if (!Array.isArray(items) || !items.length) return;
        const group = document.createElement("div");
        group.className = "result-group";
        const heading = document.createElement("h4");
        heading.textContent = title;
        const list = document.createElement("ul");
        for (const item of items) {
          const li = document.createElement("li");
          li.textContent = String(item);
          list.appendChild(li);
        }
        group.append(heading, list);
        result.appendChild(group);
      }

      function renderAnalysis(analysis) {
        result.replaceChildren();
        if (analysis && typeof analysis === "object" && !Array.isArray(analysis)) {
          const score = Number(analysis.hook_score);
          if (Number.isFinite(score)) {
            const row = document.createElement("div");
            row.className = "score-row";
            const value = document.createElement("div");
            value.className = "score-value";
            value.textContent = String(score);
            const label = document.createElement("div");
            label.className = "score-label";
            label.textContent = "Hook score / 100";
            row.append(value, label);
            result.appendChild(row);
          }
          appendList("What works", analysis.strengths);
          appendList("Make it stronger", analysis.suggestions);
          if (analysis.audience_fit) {
            const fit = document.createElement("p");
            fit.className = "audience-fit";
            const label = document.createElement("strong");
            label.textContent = "Audience fit";
            fit.append(label, document.createTextNode(String(analysis.audience_fit)));
            result.appendChild(fit);
          }
          if (result.childElementCount) return;
        }
        const text = document.createElement("pre");
        text.className = "result-text";
        text.textContent = typeof analysis === "string" ? analysis : JSON.stringify(analysis, null, 2);
        result.appendChild(text);
      }

      updateCount();
      input.addEventListener("input", updateCount);
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!form.reportValidity()) return;
        button.disabled = true;
        button.textContent = "Analyzing with Grok…";
        form.setAttribute("aria-busy", "true");
        result.textContent = "Reading your opening and scoring the first three seconds…";
        try {
          const response = await fetch("/v1/demo/invoke", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ script_text: input.value }),
          });
          const data = await response.json().catch(function () { return null; });
          if (!response.ok || !data?.ok) {
            const messages = {
              400: "Enter between 10 and 1200 characters.",
              403: "Please run the demo from this page.",
              429: "Demo limit reached. Try again later or request production access.",
              502: "Grok is temporarily unavailable. Please try again.",
            };
            throw new Error(messages[response.status] || data?.error || "The demo could not be completed.");
          }
          renderAnalysis(data.analysis);
        } catch (error) {
          const message = document.createElement("p");
          message.className = "result-error";
          message.textContent = error instanceof Error ? error.message : "The demo could not be completed.";
          result.replaceChildren(message);
        } finally {
          button.disabled = false;
          button.textContent = "Analyze my hook →";
          form.removeAttribute("aria-busy");
        }
      });
    })();

    (async function loadLeaderboard() {
      const container = document.getElementById("leaderboard-content");
      const updatedAt = document.getElementById("updated-at");
      try {
        const response = await fetch("/v1/leaderboard", { headers: { "Accept": "application/json" } });
        if (!response.ok) throw new Error("Leaderboard request failed");
        const data = await response.json();
        const entries = Array.isArray(data.entries) ? data.entries : [];
        updatedAt.textContent = data.updated_at ? "Updated " + new Date(data.updated_at).toLocaleString() : "KV connected · awaiting metrics";
        if (!entries.length) {
          container.innerHTML = '<div class="empty-state"><div><div class="empty-title">No ranking data yet</div><div class="empty-copy">Metrics will appear here after the first leaderboard snapshot is published.</div></div><div class="empty-code">entries: []</div></div>';
          return;
        }
        const table = document.createElement("table");
        table.className = "metrics-table";
        table.innerHTML = "<thead><tr><th>Bot</th><th>Calls</th><th>Failures</th><th>Avg latency</th><th>Total tokens</th></tr></thead>";
        const tbody = document.createElement("tbody");
        for (const entry of entries) {
          const calls = Number(entry.calls || 0);
          const row = document.createElement("tr");
          const values = [
            entry.bot || entry.name || "Unknown bot",
            calls,
            Number(entry.failures || 0),
            calls ? Math.round(Number(entry.total_latency_ms || 0) / calls) + " ms" : "—",
            Number(entry.total_tokens || 0),
          ];
          for (const value of values) {
            const cell = document.createElement("td");
            cell.textContent = String(value);
            row.appendChild(cell);
          }
          tbody.appendChild(row);
        }
        table.appendChild(tbody);
        const wrapper = document.createElement("div");
        wrapper.className = "table-wrap";
        wrapper.appendChild(table);
        container.replaceChildren(wrapper);
      } catch (error) {
        updatedAt.textContent = "Snapshot temporarily unavailable";
        container.innerHTML = '<div class="empty-state"><div><div class="empty-title">Metrics could not be loaded</div><div class="empty-copy">The registry is still online. Try refreshing this page.</div></div></div>';
      }
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60",
    },
  });
}
