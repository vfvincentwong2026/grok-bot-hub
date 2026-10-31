import { formatIdr, PLANS, type Plan } from "./plans";
import { formatIdrId, mailtoHref, whatsappHref } from "./sales-contact";
import type { Language } from "./types";

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
    .contact-alt { display: block; margin-top: 12px; color: var(--muted); font-size: 12px; line-height: 1.6; text-align: center; text-decoration: underline; text-underline-offset: 3px; }
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

type PlanText = Pick<Plan, "name" | "description" | "features">;

const ID_PLAN_COPY: Record<Plan["id"], PlanText> = {
  free: {
    name: "Gratis",
    description: "Uji kualitas analisis sebelum integrasi.",
    features: ["Analisis hook lewat browser dan MCP", "3 panggilan per IP per jam, dibagi antara web dan MCP", "20 panggilan global per hari", "Tanpa API key"],
  },
  creator: {
    name: "Creator",
    description: "Untuk penulis independen dan tim konten kecil.",
    features: ["1.000 analisis selama 30 hari", "API key produksi", "Output JSON terstruktur"],
  },
  studio: {
    name: "Studio",
    description: "Untuk tim yang meninjau naskah dalam volume besar.",
    features: ["5.000 analisis selama 30 hari", "Semua fitur Creator", "Dukungan integrasi"],
  },
};

interface PricingCopy {
  kicker: string;
  title: string;
  note: string;
  recommended: string;
  freePeriod: string;
  paidPeriod: string;
  tryFree: string;
  buyPass: (planName: string) => string;
  contactWhatsapp: string;
  contactEmail: string;
  footnote: string;
  faq: Array<{ question: string; answer: string }>;
}

const EN_PRICING_COPY: PricingCopy = {
  kicker: "02 / Pricing",
  title: "From first hook to full slate",
  note: "One-time purchase · no auto-renew",
  recommended: "Recommended",
  freePeriod: "browser access",
  paidPeriod: "/ 30 days",
  tryFree: "Try free demo",
  buyPass: (planName) => `Buy ${planName} 30-day pass`,
  contactWhatsapp: "Activate via WhatsApp",
  contactEmail: "or email us",
  footnote: "Prices in IDR · 30-day passes · No automatic renewal or overage charges",
  faq: [
    { question: "What counts as one analysis?", answer: "One successful POST /v1/app/invoke request counts once. If the upstream AI call fails, the reserved quota is refunded automatically." },
    { question: "What happens when I reach my limit?", answer: "The API returns HTTP 429 with your usage. There are no overage charges. You can buy another 30-day pass when you need more analyses." },
    { question: "How does the 30-day pass work?", answer: "Your API key is valid for 30 days after payment. Unused analyses expire with the key and do not roll over. Each new purchase issues a separate key." },
    { question: "Will I be charged automatically?", answer: "No. This is a one-time purchase, not an auto-renewing subscription. There is nothing to cancel; buy another pass only when you want to continue." },
    { question: "How do I integrate the paid API?", answer: "Send your script as JSON to /v1/app/invoke with Authorization: Bearer YOUR_API_KEY. The response contains the structured hook analysis and remaining quota." },
    { question: "What is the refund policy?", answer: 'Failed checkouts do not issue a key. Delivery failures and material service outages are covered by our <a href="/refunds">refund policy</a>.' },
    { question: "How are scripts and API keys handled?", answer: 'Scripts are sent to xAI for analysis, so do not submit sensitive personal data. API keys are stored only as SHA-256 hashes; the plaintext key is shown once. See our <a href="/privacy">privacy policy</a>.' },
  ],
};

const PRICING_COPY: Record<Language, PricingCopy> = {
  en: EN_PRICING_COPY,
  id: {
    kicker: "02 / Harga",
    title: "Dari hook pertama hingga satu slate penuh",
    note: "Sekali bayar · tanpa perpanjangan otomatis",
    recommended: "Direkomendasikan",
    freePeriod: "akses browser",
    paidPeriod: "/ 30 hari",
    tryFree: "Coba demo gratis",
    buyPass: (planName) => `Beli pass 30 hari ${planName}`,
    contactWhatsapp: "Aktivasi via WhatsApp",
    contactEmail: "atau kirim email",
    footnote: "Harga dalam IDR · Pass 30 hari · Tanpa perpanjangan otomatis atau biaya kelebihan pemakaian",
    faq: [
      { question: "Apa yang dihitung sebagai satu analisis?", answer: "Satu permintaan POST /v1/app/invoke yang berhasil dihitung satu kali. Jika panggilan AI ke upstream gagal, kuota yang dipesan dikembalikan otomatis." },
      { question: "Apa yang terjadi jika batas saya tercapai?", answer: "API mengembalikan HTTP 429 beserta pemakaian Anda. Tidak ada biaya kelebihan pemakaian. Anda dapat membeli pass 30 hari lagi jika membutuhkan lebih banyak analisis." },
      { question: "Bagaimana cara kerja pass 30 hari?", answer: "API key Anda berlaku 30 hari setelah pembayaran. Analisis yang tidak terpakai hangus bersama key dan tidak dipindahkan. Setiap pembelian baru menerbitkan key terpisah." },
      { question: "Apakah saya akan ditagih otomatis?", answer: "Tidak. Ini pembelian sekali bayar, bukan langganan yang diperpanjang otomatis. Tidak ada yang perlu dibatalkan; beli pass lagi hanya jika Anda ingin melanjutkan." },
      { question: "Bagaimana cara mengintegrasikan API berbayar?", answer: "Kirim naskah Anda sebagai JSON ke /v1/app/invoke dengan Authorization: Bearer YOUR_API_KEY. Respons berisi analisis hook terstruktur dan sisa kuota." },
      { question: "Bagaimana kebijakan pengembalian dana?", answer: 'Checkout yang gagal tidak menerbitkan key. Kegagalan pengiriman dan gangguan layanan yang material dicakup oleh <a href="/refunds">kebijakan pengembalian dana</a> kami.' },
      { question: "Bagaimana naskah dan API key ditangani?", answer: 'Naskah dikirim ke xAI untuk dianalisis, jadi jangan kirim data pribadi yang sensitif. API key hanya disimpan sebagai hash SHA-256; key asli hanya ditampilkan sekali. Lihat <a href="/privacy">kebijakan privasi</a> kami.' },
    ],
  },
  zh: {
    ...EN_PRICING_COPY,
    tryFree: "免费试用",
    buyPass: (planName) => `购买 ${planName} 30 天通行证`,
    contactWhatsapp: "WhatsApp 联系开通",
    contactEmail: "或发送邮件",
  },
};

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function contactLinks(plan: Plan, copy: PricingCopy, primary: boolean): string {
  const whatsappClass = primary ? `button ${plan.id === "studio" ? "primary" : "secondary"}` : "contact-alt";
  return `<a class="${whatsappClass}" href="${escapeAttr(whatsappHref(plan.name, plan.priceIdr))}" target="_blank" rel="noopener noreferrer" data-contact-channel="whatsapp">${copy.contactWhatsapp}</a>
    <a class="contact-alt" href="${escapeAttr(mailtoHref(plan.name, plan.priceIdr))}" data-contact-channel="email">${copy.contactEmail}</a>`;
}

export function renderPricingSection(checkoutEnabled: boolean, language: Language = "en"): string {
  const copy = PRICING_COPY[language];
  const cards = PLANS.map((plan) => {
    const planCopy = language === "id" ? ID_PLAN_COPY[plan.id] : plan;
    const features = planCopy.features.map((feature) => `<li>${feature}</li>`).join("");
    const priceText = language === "id" ? formatIdrId(plan.priceIdr) : formatIdr(plan.priceIdr);
    const action = plan.id === "free"
      ? `<a class="button secondary" href="#demo">${copy.tryFree}</a>`
      : checkoutEnabled
        ? `<button class="button ${plan.id === "studio" ? "primary" : "secondary"} checkout-button" data-plan="${plan.id}" type="button">${copy.buyPass(planCopy.name)}</button>${contactLinks(plan, copy, false)}`
        : contactLinks(plan, copy, true);
    return `
      <article class="price-card ${plan.id === "studio" ? "recommended" : ""}">
        ${plan.id === "studio" ? `<span class="recommended-label">${copy.recommended}</span>` : ""}
        <h3>${planCopy.name}</h3>
        <p class="price-description">${planCopy.description}</p>
        <div class="price"><span class="price-value">${priceText}</span><span class="price-period">${plan.id === "free" ? copy.freePeriod : copy.paidPeriod}</span></div>
        <ul class="plan-features">${features}</ul>
        ${action}
      </article>`;
  }).join("");
  const faq = copy.faq.map((item) => `<details><summary>${item.question}</summary><p>${item.answer}</p></details>`).join("");

  return `
    <section id="pricing">
      <div class="section-head">
        <div><div class="section-kicker">${copy.kicker}</div><h2>${copy.title}</h2></div>
        <div class="section-note">${copy.note}</div>
      </div>
      <div class="pricing-grid">${cards}</div>
      <div id="checkout-status" class="checkout-status" role="status" aria-live="polite"></div>
      <p class="pricing-note">${copy.footnote}</p>
      <div class="faq-grid">${faq}</div>
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
