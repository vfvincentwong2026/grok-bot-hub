import { PLANS } from "./plans";

export const pricingStyles = `
    .billing-toggle { display: inline-flex; padding: 3px; border: 1px solid var(--line); border-radius: 7px; background: var(--surface); }
    .interval-button { min-height: 34px; padding: 0 12px; border: 0; border-radius: 4px; background: transparent; color: var(--muted); font: 11px/1 var(--mono); cursor: pointer; }
    .interval-button.active { background: var(--surface-2); color: var(--text); }
    .interval-button span { color: var(--accent); }
    .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .price-card { position: relative; display: flex; flex-direction: column; padding: 26px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
    .price-card.recommended { border-color: #667d3e; }
    .recommended-label { position: absolute; top: 18px; right: 18px; color: var(--accent); font: 10px/1 var(--mono); text-transform: uppercase; }
    .price-card h3 { margin: 0 0 10px; }
    .price-description { min-height: 46px; margin: 0; color: var(--muted); font-size: 13px; line-height: 1.6; }
    .price { display: flex; align-items: baseline; gap: 6px; margin: 26px 0 8px; }
    .price-value { font: 40px/1 var(--mono); letter-spacing: -0.06em; }
    .price-period { color: var(--muted); font: 12px/1 var(--mono); }
    .annual-equivalent { min-height: 18px; color: var(--muted); font: 10px/1.5 var(--mono); }
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
    @media (max-width: 860px) {
      .pricing-grid { grid-template-columns: 1fr; }
      .price-description { min-height: auto; }
      .plan-features { flex: initial; }
    }
    @media (max-width: 560px) {
      .faq-grid { grid-template-columns: 1fr; }
      .billing-toggle { align-self: flex-start; }
    }
`;

export function renderPricingSection(checkoutEnabled: boolean): string {
  const cards = PLANS.map((plan) => {
    const features = plan.features.map((feature) => `<li>${feature}</li>`).join("");
    const action = plan.id === "free"
      ? `<a class="button secondary" href="#demo">Try free demo</a>`
      : checkoutEnabled
        ? `<button class="button ${plan.id === "studio" ? "primary" : "secondary"} checkout-button" data-plan="${plan.id}" type="button">Choose ${plan.name}</button>`
        : `<a class="button ${plan.id === "studio" ? "primary" : "secondary"}" href="https://github.com/vfvincentwong2026/grok-bot-hub/issues/new?title=${encodeURIComponent(`${plan.name} API access`)}">Request ${plan.name}</a>`;
    return `
      <article class="price-card ${plan.id === "studio" ? "recommended" : ""}">
        ${plan.id === "studio" ? '<span class="recommended-label">Recommended</span>' : ""}
        <h3>${plan.name}</h3>
        <p class="price-description">${plan.description}</p>
        <div class="price"><span class="price-value" data-monthly="$${plan.monthlyPrice}" data-annual="$${plan.annualPrice}">$${plan.monthlyPrice}</span><span class="price-period" data-monthly=" /month" data-annual=" /year"> /month</span></div>
        <div class="annual-equivalent" data-plan-id="${plan.id}"></div>
        <ul class="plan-features">${features}</ul>
        ${action}
      </article>`;
  }).join("");

  return `
    <section id="pricing">
      <div class="section-head">
        <div><div class="section-kicker">02 / Pricing</div><h2>From first hook to full slate</h2></div>
        <div class="billing-toggle" role="group" aria-label="Billing interval">
          <button class="interval-button active" data-interval="monthly" type="button">Monthly</button>
          <button class="interval-button" data-interval="annual" type="button">Annual <span>save ~20%</span></button>
        </div>
      </div>
      <div class="pricing-grid">${cards}</div>
      <div id="checkout-status" class="checkout-status" role="status" aria-live="polite"></div>
      <p class="pricing-note">Quotas reset on the first day of each month UTC · No automatic overage charges · Prices in USD</p>
      <div class="faq-grid">
        <details><summary>What counts as one analysis?</summary><p>One successful POST /v1/app/invoke request counts once. If the upstream AI call fails, the reserved quota is refunded automatically.</p></details>
        <details><summary>What happens when I reach my limit?</summary><p>The API returns HTTP 429 with your usage. There are no automatic overage charges; quota resets at the start of the next UTC month.</p></details>
        <details><summary>How do I integrate the paid API?</summary><p>Send your script as JSON to /v1/app/invoke with Authorization: Bearer YOUR_API_KEY. The response contains the same structured hook analysis as the demo.</p></details>
        <details><summary>How does annual billing work?</summary><p>You pay once per year and keep the same monthly analysis quota. Unused analyses do not roll over.</p></details>
        <details><summary>Can I cancel or resolve a billing problem?</summary><p>Open a billing issue with your Stripe receipt. Cancellation takes effect at the end of the paid term; failed checkouts do not issue an API key.</p></details>
        <details><summary>How are scripts and API keys handled?</summary><p>Scripts are sent to xAI for analysis, so do not submit sensitive personal data. API keys are stored only as SHA-256 hashes; the plaintext key is shown once.</p></details>
      </div>
    </section>`;
}

export const pricingScript = `
    (function setupPricing() {
      const section = document.getElementById("pricing");
      const status = document.getElementById("checkout-status");
      if (!section || !status) return;
      let interval = "monthly";

      function showStatus(message, isError) {
        status.replaceChildren();
        status.className = "checkout-status visible" + (isError ? " error" : "");
        const text = document.createElement("div");
        text.textContent = message;
        status.appendChild(text);
      }

      function setInterval(next) {
        interval = next;
        section.querySelectorAll(".interval-button").forEach(function (button) {
          button.classList.toggle("active", button.dataset.interval === next);
        });
        section.querySelectorAll(".price-value").forEach(function (price) {
          price.textContent = price.dataset[next];
        });
        section.querySelectorAll(".price-period").forEach(function (period) {
          period.textContent = period.dataset[next];
        });
        section.querySelectorAll(".annual-equivalent").forEach(function (note) {
          const plan = note.dataset.planId;
          if (next === "annual" && plan !== "free") {
            const card = note.closest(".price-card");
            const annual = Number(card.querySelector(".price-value").dataset.annual.replace(/[^0-9.]/g, ""));
            note.textContent = "Equivalent to $" + (annual / 12).toFixed(2) + " per month";
          } else {
            note.textContent = "";
          }
        });
      }

      section.querySelectorAll(".interval-button").forEach(function (button) {
        button.addEventListener("click", function () { setInterval(button.dataset.interval); });
      });

      section.querySelectorAll(".checkout-button").forEach(function (button) {
        button.addEventListener("click", async function () {
          button.disabled = true;
          button.textContent = "Opening Stripe…";
          try {
            const response = await fetch("/v1/billing/checkout", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ plan: button.dataset.plan, interval: interval }),
            });
            const data = await response.json().catch(function () { return null; });
            if (!response.ok || !data?.ok || !data.url) throw new Error(data?.error || "Checkout is unavailable.");
            window.location.assign(data.url);
          } catch (error) {
            showStatus(error instanceof Error ? error.message : "Checkout is unavailable.", true);
            button.disabled = false;
            button.textContent = "Choose " + button.dataset.plan.charAt(0).toUpperCase() + button.dataset.plan.slice(1);
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
            message.textContent = "Payment confirmed. Save your API key now—it will not be shown again.";
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
