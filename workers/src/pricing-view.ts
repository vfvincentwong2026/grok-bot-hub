import { formatIdr, PLANS } from "./plans";

export const pricingStyles = `
    .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .price-card { position: relative; display: flex; flex-direction: column; padding: 26px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
    .price-card.recommended { border-color: #667d3e; }
    .recommended-label { position: absolute; top: 18px; right: 18px; color: var(--accent); font: 10px/1 var(--mono); text-transform: uppercase; }
    .price-card h3 { margin: 0 0 10px; }
    .price-description { min-height: 46px; margin: 0; color: var(--muted); font-size: 13px; line-height: 1.6; }
    .price { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; margin: 26px 0 8px; }
    .price-value { font: 36px/1 var(--mono); letter-spacing: -0.06em; }
    .price-period { color: var(--muted); font: 12px/1 var(--mono); }
    .plan-features { flex: 1; margin: 22px 0 26px; padding: 20px 0 0; border-top: 1px solid var(--line); list-style: none; }
    .plan-features li { position: relative; padding-left: 17px; color: #c7d0c9; font-size: 13px; line-height: 1.6; }
    .plan-features li + li { margin-top: 11px; }
    .plan-features li::before { content: "✓"; position: absolute; left: 0; color: var(--accent); }
    .price-card .button { width: 100%; cursor: pointer; }
    .price-card .button:disabled { cursor: wait; opacity: 0.65; }
    .pricing-note { margin: 18px 0 0; color: var(--muted); font: 11px/1.7 var(--mono); }
    .checkout-status { display: none; margin-top: 18px; padding: 18px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface-2); font-size: 13px; line-height: 1.7; }
    .checkout-status.visible { display: block; }
    .checkout-status.error { border-color: #6d3a35; color: #ffb4a8; }
    .checkout-status code { display: block; margin: 12px 0; padding: 12px; overflow-wrap: anywhere; background: var(--bg); color: var(--accent); }
    .checkout-status .button { margin-top: 8px; cursor: pointer; }
    .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 28px; margin-top: 34px; }
    .faq-grid details { border-top: 1px solid var(--line); }
    .faq-grid summary { padding: 18px 0; color: var(--text); font-size: 13px; font-weight: 650; cursor: pointer; }
    .faq-grid details p { margin: -4px 0 18px; color: var(--muted); font-size: 13px; line-height: 1.7; }
    .faq-grid a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
    @media (max-width: 860px) {
      .pricing-grid { grid-template-columns: 1fr; }
      .price-description { min-height: auto; }
      .plan-features { flex: initial; }
    }
    @media (max-width: 560px) {
      .faq-grid { grid-template-columns: 1fr; }
    }
`;

export function renderPricingSection(checkoutEnabled: boolean): string {
  const cards = PLANS.map((plan) => {
    const features = plan.features.map((feature) => `<li>${feature}</li>`).join("");
    const action = plan.id === "free"
      ? `<a class="button secondary" href="#demo">Try free demo</a>`
      : checkoutEnabled
        ? `<button class="button ${plan.id === "studio" ? "primary" : "secondary"} checkout-button" data-plan="${plan.id}" type="button">Buy ${plan.name} 30-day pass</button>`
        : `<a class="button ${plan.id === "studio" ? "primary" : "secondary"}" href="https://github.com/vfvincentwong2026/grok-bot-hub/issues/new?title=${encodeURIComponent(`${plan.name} 30-day API pass`)}">Request ${plan.name}</a>`;
    return `
      <article class="price-card ${plan.id === "studio" ? "recommended" : ""}">
        ${plan.id === "studio" ? '<span class="recommended-label">Recommended</span>' : ""}
        <h3>${plan.name}</h3>
        <p class="price-description">${plan.description}</p>
        <div class="price"><span class="price-value">${formatIdr(plan.priceIdr)}</span><span class="price-period">${plan.id === "free" ? "browser access" : "/ 30 days"}</span></div>
        <ul class="plan-features">${features}</ul>
        ${action}
      </article>`;
  }).join("");

  return `
    <section id="pricing">
      <div class="section-head">
        <div><div class="section-kicker">02 / Pricing</div><h2>From first hook to full slate</h2></div>
        <div class="section-note">One-time purchase · no auto-renew</div>
      </div>
      <div class="pricing-grid">${cards}</div>
      <div id="checkout-status" class="checkout-status" role="status" aria-live="polite"></div>
      <p class="pricing-note">Prices in IDR · 30-day passes · No automatic renewal or overage charges</p>
      <div class="faq-grid">
        <details><summary>What counts as one analysis?</summary><p>One successful POST /v1/app/invoke request counts once. If the upstream AI call fails, the reserved quota is refunded automatically.</p></details>
        <details><summary>What happens when I reach my limit?</summary><p>The API returns HTTP 429 with your usage. There are no overage charges. You can buy another 30-day pass when you need more analyses.</p></details>
        <details><summary>How does the 30-day pass work?</summary><p>Your API key is valid for 30 days after payment. Unused analyses expire with the key and do not roll over. Each new purchase issues a separate key.</p></details>
        <details><summary>Will I be charged automatically?</summary><p>No. This is a one-time purchase, not an auto-renewing subscription. There is nothing to cancel; buy another pass only when you want to continue.</p></details>
        <details><summary>How do I integrate the paid API?</summary><p>Send your script as JSON to /v1/app/invoke with Authorization: Bearer YOUR_API_KEY. The response contains the structured hook analysis and remaining quota.</p></details>
        <details><summary>What is the refund policy?</summary><p>Failed checkouts do not issue a key. Delivery failures and material service outages are covered by our <a href="/refunds">refund policy</a>.</p></details>
        <details><summary>How are scripts and API keys handled?</summary><p>Scripts are sent to xAI for analysis, so do not submit sensitive personal data. API keys are stored only as SHA-256 hashes; the plaintext key is shown once. See our <a href="/privacy">privacy policy</a>.</p></details>
      </div>
    </section>`;
}

export const pricingScript = `
    (function setupPricing() {
      const section = document.getElementById("pricing");
      const status = document.getElementById("checkout-status");
      if (!section || !status) return;

      function showStatus(message, isError) {
        status.replaceChildren();
        status.className = "checkout-status visible" + (isError ? " error" : "");
        const text = document.createElement("div");
        text.textContent = message;
        status.appendChild(text);
      }

      section.querySelectorAll(".checkout-button").forEach(function (button) {
        button.addEventListener("click", async function () {
          button.disabled = true;
          button.textContent = "Opening Stripe…";
          try {
            const response = await fetch("/v1/billing/checkout", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ plan: button.dataset.plan }),
            });
            const data = await response.json().catch(function () { return null; });
            if (!response.ok || !data?.ok || !data.url) throw new Error(data?.error || "Checkout is unavailable.");
            window.location.assign(data.url);
          } catch (error) {
            showStatus(error instanceof Error ? error.message : "Checkout is unavailable.", true);
            button.disabled = false;
            button.textContent = "Buy " + button.dataset.plan.charAt(0).toUpperCase() + button.dataset.plan.slice(1) + " 30-day pass";
          }
        });
      });

      const params = new URLSearchParams(window.location.search);
      if (params.get("billing") === "cancelled") {
        showStatus("Checkout cancelled. No charge was made.", false);
      }
      if (params.get("billing") === "success" && params.get("session_id")) {
        showStatus("Verifying your Stripe payment…", false);
        fetch("/v1/billing/complete?session_id=" + encodeURIComponent(params.get("session_id")))
          .then(async function (response) {
            const data = await response.json();
            if (!response.ok || !data.ok) throw new Error(data?.error || "Payment verification failed.");
            if (data.already_issued) {
              showStatus("This order already issued its API key. Use the key saved in this browser or open a billing issue for help.", false);
              return;
            }
            try { localStorage.setItem("gbh_api_key", data.api_key); } catch {}
            status.replaceChildren();
            status.className = "checkout-status visible";
            const message = document.createElement("div");
            message.textContent = "Payment confirmed. Save your API key now—it will not be shown again. Valid until " + new Date(data.expires_at).toLocaleString() + ".";
            const key = document.createElement("code");
            key.textContent = data.api_key;
            const copy = document.createElement("button");
            copy.className = "button secondary";
            copy.type = "button";
            copy.textContent = "Copy API key";
            copy.addEventListener("click", async function () {
              await navigator.clipboard.writeText(data.api_key);
              copy.textContent = "Copied";
            });
            status.append(message, key, copy);
            window.history.replaceState(null, "", window.location.pathname + "#pricing");
          })
          .catch(function (error) { showStatus(error instanceof Error ? error.message : "Payment verification failed.", true); });
      }
      if (window.location.pathname === "/pricing" && !window.location.search) section.scrollIntoView();
    })();
`;
