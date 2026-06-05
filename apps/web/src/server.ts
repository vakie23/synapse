import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApiProxy } from "./api-proxy.js";
import { renderPrivacyPage, renderTermsPage } from "./legal-pages.js";
import { mobileMetaHtml } from "./mobile-meta.js";
import { renderShopPage } from "./shop-page.js";
// @ts-expect-error Admin router is built by the @hardware/admin workspace package.
import { createAdminRouter } from "../../admin/dist/router.js";

const app = express();
const webRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
app.use(express.static(path.join(webRoot, "public")));
app.use("/admin", createAdminRouter("/admin"));

const logoUrl = process.env.LOGO_URL ?? "";
const serverApiBase = process.env.API_BASE_URL ?? "http://localhost:4000";
/** Same-origin proxy so shop and admin always use the same API database. */
const publicApiBase = "/api-proxy";

if (process.env.NODE_ENV === "production") {
  const looksUnset =
    serverApiBase.includes("your-api-domain") ||
    serverApiBase.includes("example") ||
    serverApiBase.includes("localhost");
  if (looksUnset) {
    console.warn(
      "WARNING: API_BASE_URL is missing or still a placeholder. Shop products will not load until you set it on Render (synapse-web) to your live API URL."
    );
  }
}

app.use(publicApiBase, createApiProxy(serverApiBase));

async function fetchProductsForShop(): Promise<{
  products: Array<Record<string, unknown>>;
  error: string;
}> {
  const url = `${serverApiBase.replace(/\/$/, "")}/api/products`;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return {
        products: [],
        error: `Could not load products from API (${response.status}). On Render, set API_BASE_URL on synapse-web to your API service URL and ensure synapse-api is running.`
      };
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return {
        products: [],
        error: "No products in the catalog. Ensure the API service is deployed with its data disk attached."
      };
    }
    return { products: data, error: "" };
  } catch {
    return {
      products: [],
      error: "Could not reach the API. Set API_BASE_URL on the synapse-web service (e.g. https://synapse-api-w9si.onrender.com) and confirm synapse-api is online."
    };
  }
}

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${mobileMetaHtml}
  <title>Synapse Engineering</title>
  <style>
    :root {
      --brand-blue: #241c7a;
      --brand-red: #b32025;
      --brand-gold: #f0bb2d;
      --ink: #171717;
      --soft: #f4f5fb;
      --sky: #e8f1ff;
      --mint: #e8fff5;
      --lavender: #f2ecff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; font-family: "Segoe UI", system-ui, Arial, sans-serif; color: var(--ink); line-height: 1.6;
      background: linear-gradient(160deg, #ffffff 0%, #f7f9ff 45%, #fef8ef 100%); background-attachment: fixed;
    }
    .page { width: min(1200px, 96vw); margin: 0 auto; padding: 1.25rem 0 3.5rem; }
    .site-topbar {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: 1rem 1.25rem; margin-bottom: 1.25rem;
      background: linear-gradient(135deg, #ffffff, var(--soft)); border-radius: 1rem; border: 1px solid #e4e6f5;
      box-shadow: 0 12px 32px rgba(36, 28, 122, 0.08); border-bottom: 4px solid var(--brand-gold);
    }
    .topbar-shop {
      flex-shrink: 0; white-space: nowrap;
    }
    .site-brand { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: inherit; }
    .site-brand img { width: 72px; height: auto; }
    .logo-fallback-sm {
      width: 76px; height: 76px; border-radius: 50%; background: linear-gradient(135deg, #2f2ab2, var(--brand-blue));
      color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 1.25rem;
      box-shadow: 0 6px 16px rgba(36, 28, 122, 0.25);
    }
    .site-brand-text strong { display: block; color: var(--brand-blue); font-size: 1.65rem; }
    .site-brand-text span { color: var(--brand-red); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
    .hero-banner {
      position: relative; margin-bottom: 1.5rem; border-radius: 1rem; overflow: hidden;
      box-shadow: 0 16px 40px rgba(36, 28, 122, 0.22); border-bottom: 4px solid var(--brand-gold);
      max-height: clamp(200px, 28vw, 300px);
    }
    .hero-banner img {
      width: 100%; height: 100%; min-height: clamp(200px, 28vw, 300px);
      display: block; object-fit: cover; object-position: center 35%;
    }
    .hero-overlay {
      position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end;
      padding: clamp(0.85rem, 2.5vw, 1.25rem); color: #fff;
      background: linear-gradient(180deg, rgba(20, 16, 70, 0) 0%, rgba(36, 28, 122, 0.45) 50%, rgba(26, 20, 96, 0.88) 100%);
    }
    .hero-overlay h1 { margin: 0 0 0.25rem; font-size: clamp(1.15rem, 3vw, 1.65rem); font-weight: 700; max-width: 36rem; }
    .hero-overlay .tagline { margin: 0 0 0.4rem; color: var(--brand-gold); font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; }
    .hero-overlay .intro { margin: 0; max-width: 38rem; font-size: clamp(0.85rem, 2vw, 0.95rem); opacity: 0.96; line-height: 1.5; }
    .home-services { margin-bottom: 2rem; }
    .home-services h2 {
      margin: 0 0 1rem; color: var(--brand-blue); font-size: 1.35rem;
      border-bottom: 3px solid var(--brand-gold); padding-bottom: 0.45rem; display: inline-block;
    }
    .home-services .services-list {
      margin: 0.5rem 0 0; padding: 0; list-style: none;
      border: 1px solid #e4e6f5; border-radius: 0.75rem; overflow: hidden;
      background: #fff; box-shadow: 0 6px 20px rgba(36, 28, 122, 0.06);
    }
    .home-services .services-list li {
      padding: 0.85rem 1.1rem; color: var(--brand-blue); font-weight: 600; font-size: 0.95rem;
      border-bottom: 1px solid #ececf5;
    }
    .home-services .services-list li:last-child { border-bottom: 0; }
    .home-services .services-list li::before {
      content: "•"; color: var(--brand-gold); font-weight: 700; margin-right: 0.65rem;
    }
    .home-about, .home-contact {
      margin-bottom: 2rem; padding: 1.25rem 1.35rem; border-radius: 1rem;
      background: linear-gradient(135deg, #ffffff, var(--soft)); border: 1px solid #e4e6f5;
      box-shadow: 0 8px 24px rgba(36, 28, 122, 0.06);
    }
    .home-about h2, .home-contact h2 { margin: 0 0 0.75rem; color: var(--brand-blue); font-size: 1.2rem; }
    .site-nav-links { display: grid; gap: 0.45rem; }
    .site-nav-links a {
      display: block; padding: 0.85rem 1rem; border-radius: 0.65rem;
      text-decoration: none; font-weight: 700; font-size: 0.92rem; color: var(--brand-blue);
      background: linear-gradient(135deg, #fafbff, #fff); border: 1px solid #e4e6f5;
    }
    .site-nav-links a:hover { background: var(--sky); border-color: var(--brand-gold); }
    .menu-fab-wrap {
      position: fixed; top: 0.85rem; right: 0.85rem; z-index: 300;
      display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
    }
    .menu-fab {
      width: 2.75rem; height: 2.75rem; padding: 0; border-radius: 0.55rem;
      border: 1px solid #d8dbf0; background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 8px 24px rgba(36, 28, 122, 0.18); cursor: pointer;
      display: grid; place-items: center; color: var(--brand-blue);
      backdrop-filter: blur(8px);
    }
    .menu-fab:hover { background: #fff; border-color: var(--brand-gold); }
    .menu-fab[aria-expanded="true"] { background: var(--brand-blue); color: #fff; border-color: var(--brand-blue); }
    .menu-fab-label {
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--brand-blue); background: rgba(255, 255, 255, 0.92); padding: 0.1rem 0.45rem;
      border-radius: 0.35rem; border: 1px solid #e4e6f5; line-height: 1.2;
    }
    .menu-dots { font-size: 1.35rem; line-height: 1; letter-spacing: 0.05em; font-weight: 700; }
    .corner-menu {
      position: fixed; top: 5.1rem; right: 1rem; z-index: 299;
      width: min(360px, calc(100vw - 2rem)); max-height: calc(100vh - 5.5rem); overflow-y: auto;
      padding: 0.65rem; border-radius: 1rem;
      background: rgba(255, 255, 255, 0.98); border: 2px solid var(--brand-gold);
      box-shadow: 0 18px 48px rgba(36, 28, 122, 0.22);
      backdrop-filter: blur(8px);
      opacity: 0; visibility: hidden; transform: translateY(-8px) scale(0.98);
      transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
      pointer-events: none;
    }
    .corner-menu.is-open {
      opacity: 1; visibility: visible; transform: translateY(0) scale(1); pointer-events: auto;
    }
    .corner-menu-title {
      margin: 0 0 0.5rem; padding: 0.35rem 0.5rem 0.65rem; font-size: 0.72rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.12em; color: var(--brand-red); border-bottom: 1px solid #ececf5;
    }
    .accordion-list { display: grid; gap: 0.55rem; }
    @media (max-width: 720px) {
      .corner-menu { top: 4.85rem; right: 0.75rem; left: auto; width: min(360px, calc(100vw - 1.5rem)); }
      .menu-fab-wrap { top: 0.65rem; right: 0.65rem; }
    }
    .accordion { border: 1px solid #e4e6f5; border-radius: 0.85rem; background: #fff; box-shadow: 0 6px 20px rgba(36, 28, 122, 0.05); overflow: hidden; }
    .accordion[open] { box-shadow: 0 12px 32px rgba(36, 28, 122, 0.1); border-color: #d0d4f0; }
    .accordion summary {
      list-style: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between;
      gap: 0.75rem; padding: 0.85rem 1rem; font-weight: 700; font-size: 0.92rem; color: var(--brand-blue);
    }
    .accordion summary:hover { background: linear-gradient(135deg, #fafbff, #f5f7ff); }
    .accordion[open] summary { background: linear-gradient(135deg, var(--sky), #fff); border-bottom: 1px solid #ececf5; }
    .accordion summary::-webkit-details-marker { display: none; }
    .accordion summary::marker { content: ""; }
    .accordion-chevron {
      width: 1.75rem; height: 1.75rem; display: grid; place-items: center; border-radius: 50%;
      background: rgba(179, 32, 37, 0.1); color: var(--brand-red); font-size: 0.85rem; font-weight: 700; flex-shrink: 0;
    }
    .accordion[open] .accordion-chevron { background: rgba(240, 187, 45, 0.35); color: var(--brand-blue); }
    .accordion-body { padding: 1rem; background: linear-gradient(180deg, #fcfdff 0%, #fff 100%); max-height: min(50vh, 420px); overflow-y: auto; }
    .accordion-body > p:first-child { margin: 0 0 1rem; color: #444; max-width: 42rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 0.5rem; }
    .button {
      display: inline-flex; align-items: center; padding: 0.7rem 1.15rem; border-radius: 0.5rem;
      text-decoration: none; font-weight: 700; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 0;
    }
    .button-primary { background: linear-gradient(135deg, #2f2ab2, var(--brand-blue)); color: white; }
    .button-secondary { background: linear-gradient(135deg, #d53d42, var(--brand-red)); color: white; }
    .button-light { background: #fff; color: var(--brand-blue); border: 1px solid #d8dbf0; }
    .services-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
    .about-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .card {
      padding: 1.15rem 1.2rem; border-radius: 0.75rem; background: linear-gradient(145deg, #ffffff, var(--sky));
      border: 1px solid #e4e6f5; border-left: 4px solid var(--brand-gold);
    }
    .card h3 { margin: 0 0 0.5rem; color: var(--brand-blue); font-size: 0.95rem; line-height: 1.35; }
    .card p { margin: 0; font-size: 0.88rem; color: #444; line-height: 1.55; }
    .contact-panel { display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); align-items: start; }
    .contact-box {
      background: linear-gradient(135deg, #fff7ef, var(--mint)); border-left: 5px solid var(--brand-gold);
      padding: 1.15rem 1.25rem; border-radius: 0.65rem;
    }
    .contact-box p { margin: 0.5rem 0; }
    .contact-box a { color: var(--brand-blue); font-weight: 700; text-decoration: none; }
    .site-footer { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 2px solid #e8eaf5; text-align: center; font-size: 0.88rem; color: #666; }
    .site-footer a { color: var(--brand-blue); font-weight: 600; }
  </style>
</head>
<body>
  <div class="page">
    <header class="site-topbar">
      <a class="site-brand" href="/" aria-label="Synapse Engineering home">
        ${logoUrl ? `<img src="${logoUrl}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';" />` : ""}
        <span class="logo-fallback-sm" style="${logoUrl ? "display:none;" : ""}">SE</span>
        <span class="site-brand-text"><strong>Synapse Engineering</strong><span>Electrical &amp; Energy Solutions</span></span>
      </a>
      <a class="button button-primary topbar-shop" href="/shop">Shop</a>
    </header>
    <section class="hero-banner" aria-label="Synapse Engineering">
      <img src="/images/hero.svg" alt="High-voltage power lines and smart grid infrastructure" width="1600" height="900" />
      <div class="hero-overlay">
        <p class="tagline">Trusted electrical partner</p>
        <h1>Powering homes, businesses &amp; industry</h1>
        <p class="intro">
          We design, install, maintain, and supply electrical systems for residential, commercial,
          industrial, and infrastructure projects across Zimbabwe.
        </p>
      </div>
    </section>

    <section class="home-services" aria-labelledby="services-heading">
      <h2 id="services-heading">Our core services</h2>
      <ul class="services-list">
        <li>Electrical installations</li>
        <li>Solar energy solutions</li>
        <li>Maintenance and repairs</li>
        <li>Lighting solutions</li>
        <li>Electrical design and consulting</li>
        <li>Specialized installations</li>
        <li>HT and LT line construction</li>
        <li>Substation construction</li>
        <li>Supply of electrical materials</li>
      </ul>
    </section>

    <section class="home-about" id="about">
      <h2>About us</h2>
      <p>We deliver safe, quality electrical work for residential, commercial, industrial, and infrastructure projects.</p>
      <div class="about-grid" style="margin-top:1rem;">
        <article class="card"><h3>Our commitment</h3><p>Safety, quality workmanship, timely delivery, and customer satisfaction.</p></article>
        <article class="card"><h3>Who we serve</h3><p>Homeowners, builders, mines, businesses, and property developers.</p></article>
      </div>
    </section>

    <section class="home-contact" id="contact">
      <h2>Contact us</h2>
      <div class="contact-panel">
        <div class="contact-box">
          <p><strong>Email</strong><br><a href="mailto:synapseengineering@gmail.com">synapseengineering@gmail.com</a></p>
          <p><strong>Phone</strong><br><a href="tel:+263783944171">+263 783 944 171</a></p>
        </div>
        <div class="actions" style="margin-top:0;">
          <a class="button button-light" href="mailto:synapseengineering@gmail.com?subject=Customer%20Inquiry">Email us</a>
          <a class="button button-secondary" href="tel:+263783944171">Call us</a>
        </div>
      </div>
    </section>

    <footer class="site-footer">
      <p>&copy; Synapse Engineering &mdash; <a href="/shop">Shop</a> &middot; <a href="/consultation">Engineer visit</a> &middot; <a href="/track">Track order</a> &middot; <a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a> &middot; <a href="/admin">Staff admin</a></p>
    </footer>
  </div>
</body>

</html>`);
});

app.get("/shop", async (_req, res) => {
  const { products, error } = await fetchProductsForShop();
  res.type("html").send(renderShopPage(publicApiBase, {
    initialProducts: products,
    initialError: error
  }));
});

app.get("/quotation", (_req, res) => {
  res.redirect(301, "/shop");
});

app.get("/checkout", (_req, res) => {
  res.redirect(301, "/shop");
});

app.get("/track", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Track Order | Synapse Engineering</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: linear-gradient(135deg, #f5f8ff, #fff7f1); color: #1a1a1a; }
    main { width: min(1100px, 94vw); margin: 0 auto; padding: 2rem 0 3rem; }
    h1, h2 { color: #241c7a; }
    .panel { background: linear-gradient(135deg, #ffffff, #f7f9ff); border-radius: 0.8rem; padding: 1.2rem; box-shadow: 0 10px 30px rgba(36,28,122,0.10); }
    .field-grid { display: grid; gap: 1rem; margin-top: 1rem; }
    label { display: block; font-weight: 700; margin-bottom: 0.35rem; }
    input { width: 100%; padding: 0.75rem; border: 1px solid #cfd4ea; border-radius: 0.5rem; font: inherit; }
    .button { display: inline-block; padding: 0.85rem 1rem; border-radius: 0.5rem; text-decoration: none; font-weight: 700; }
    .primary { background: linear-gradient(135deg, #2f2ab2, #241c7a); color: white; border: 0; cursor: pointer; }
    .status { margin-top: 1rem; padding: 1rem; border-radius: 0.65rem; background: linear-gradient(135deg, #eef3ff, #f5ecff); color: #241c7a; }
    .error { margin-top: 1rem; padding: 1rem; border-radius: 0.65rem; background: linear-gradient(135deg, #fff1f1, #ffe7e7); color: #b32025; }
    .tracker { margin-top: 1.5rem; display: grid; gap: 1rem; }
    #trackMap { width: 100%; height: 340px; border-radius: 0.65rem; margin-top: 1rem; background: #eef3ff; border: 1px solid #d8dbf0; }
    .map-legend { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; margin-top: 0.75rem; font-size: 0.88rem; color: #444; }
    .map-legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
    .map-legend i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .eta-box { margin-top: 1rem; padding: 0.85rem 1rem; border-radius: 0.5rem; background: #fff7ef; border-left: 4px solid #f0bb2d; color: #241c7a; font-weight: 700; }
    .track-row { display: grid; grid-template-columns: 1fr 1.2fr; gap: 1rem; }
    .track-row span:first-child { font-weight: 700; color: #241c7a; }
    .back { display: inline-block; margin-top: 1rem; color: #241c7a; text-decoration: none; }
    @media (max-width: 700px) { .track-row { grid-template-columns: 1fr; } }
  </style>
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
</head>
<body>
  <main>
    <section class="panel">
      <h1>Track your order</h1>
      <p>Enter the order ID you received when your order was confirmed and see the exact transit location, stage, and delivery updates.</p>
      <form id="track-form">
        <div class="field-grid">
          <div>
            <label for="orderId">Order ID</label>
            <input id="orderId" name="orderId" required />
          </div>
        </div>
        <button class="button primary" type="submit">Check status</button>
      </form>
      <div id="trackResult" hidden class="status"></div>
      <div id="trackError" hidden class="error"></div>
      <div id="trackMap">Enter an order ID above to view the delivery route on the map.</div>
      <div id="mapLegend" class="map-legend" hidden>
        <span><i style="background:#2e7d32"></i> Dispatch (goods from)</span>
        <span><i style="background:#f0bb2d"></i> Goods in transit now</span>
        <span><i style="background:#b32025"></i> Your address</span>
      </div>
      <a class="back" href="/">&larr; Back to home</a>
    </section>
  </main>
  <script>
    const apiBase = ${JSON.stringify(publicApiBase)};

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    const trackForm = document.getElementById("track-form");
    const trackResult = document.getElementById("trackResult");
    const trackError = document.getElementById("trackError");
    const trackMapEl = document.getElementById("trackMap");
    const mapLegend = document.getElementById("mapLegend");
    let trackMap;
    let trackLayerGroup;

    function mapPin(color) {
      return L.divIcon({
        className: "",
        html: '<span style="display:block;width:12px;height:12px;border-radius:50%;background:' + color + ';border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });
    }

    function drawTrackingRoute(data) {
      const origin = data.origin || data.tracking.origin;
      const dest = data.customerLocation;
      const current = data.tracking.coordinates;
      if (!origin || !dest || !current) return;

      trackMapEl.innerHTML = "";
      trackMap = L.map("trackMap");
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(trackMap);
      trackLayerGroup = L.layerGroup().addTo(trackMap);
      const points = [
        [origin.lat, origin.lng],
        [current.lat, current.lng],
        [dest.lat, dest.lng]
      ];
      const routeLine = L.polyline(points, { color: "#241c7a", weight: 4, dashArray: "10 8" }).addTo(trackLayerGroup);
      L.marker([origin.lat, origin.lng], { icon: mapPin("#2e7d32") })
        .addTo(trackLayerGroup)
        .bindPopup("Dispatch: " + (origin.label || "Synapse Engineering"));
      L.marker([current.lat, current.lng], { icon: mapPin("#f0bb2d") })
        .addTo(trackLayerGroup)
        .bindPopup(data.tracking.currentLocation || "Goods in transit");
      L.marker([dest.lat, dest.lng], { icon: mapPin("#b32025") })
        .addTo(trackLayerGroup)
        .bindPopup("Your delivery address");
      trackMap.fitBounds(routeLine.getBounds(), { padding: [28, 28] });
      mapLegend.hidden = false;
      setTimeout(function () { trackMap.invalidateSize(); }, 200);
    }

    trackForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      trackResult.hidden = true;
      trackError.hidden = true;
      mapLegend.hidden = true;
      const orderId = document.getElementById("orderId").value.trim();
      if (!orderId) {
        trackError.hidden = false;
        trackError.textContent = "Please enter your order ID.";
        return;
      }

      try {
        const response = await fetch(apiBase + "/api/orders/" + encodeURIComponent(orderId) + "/tracking");
        if (!response.ok) {
          const body = await response.text();
          trackError.hidden = false;
          trackError.textContent = body || "Order not found. Please verify your order ID.";
          return;
        }

        const data = await response.json();
        const eta = data.tracking.expectedArrivalAt
          ? new Date(data.tracking.expectedArrivalAt).toLocaleString()
          : "To be confirmed";
        const originLabel = (data.origin && data.origin.label) ? data.origin.label : "Synapse dispatch";

        trackResult.hidden = false;
        trackResult.innerHTML =
          '<div class="tracker">' +
            '<div class="track-row"><span>Current stage</span><span>' + escapeHtml(data.tracking.stage) + '</span></div>' +
            '<div class="track-row"><span>Shipped from</span><span>' + escapeHtml(originLabel) + '</span></div>' +
            '<div class="track-row"><span>Current location</span><span>' + escapeHtml(data.tracking.currentLocation) + '</span></div>' +
            '<div class="eta-box">Expected arrival: ' + escapeHtml(eta) + '</div>' +
            '<div class="track-row"><span>Last updated</span><span>' + escapeHtml(new Date(data.tracking.updatedAt).toLocaleString()) + '</span></div>' +
          '</div>' +
          '<p style="margin-top:1rem;">Questions? <a href="tel:+263783944171">+263 783 944 171</a> &middot; <a href="mailto:synapseengineering@gmail.com">Email us</a></p>';

        drawTrackingRoute(data);
      } catch (error) {
        trackError.hidden = false;
        trackError.textContent = "Unable to reach the tracking service. Please try again later.";
      }
    });
  </script>
</body>
</html>`);
});

app.get("/consultation", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Engineer home visit | Synapse Engineering</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: linear-gradient(135deg, #f5f8ff, #fff8ef); color: #1a1a1a; }
    main { width: min(520px, 92vw); margin: 0 auto; padding: 2.5rem 0 3rem; text-align: center; }
    h1 { color: #241c7a; font-size: 1.5rem; }
    p { line-height: 1.65; color: #444; }
    .call-btn {
      display: inline-block; margin: 1.5rem 0 1rem; padding: 1.1rem 1.75rem;
      background: linear-gradient(135deg, #2f2ab2, #241c7a); color: #fff;
      text-decoration: none; font-weight: 700; font-size: 1.15rem; border-radius: 0.65rem;
      box-shadow: 0 10px 24px rgba(36, 28, 122, 0.25);
    }
    .call-btn:hover { filter: brightness(1.05); }
    .back { color: #241c7a; text-decoration: none; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <h1>Request an engineer home visit</h1>
    <p>Need electrical repairs, fault finding, or a consultation at your home or site? Call our engineer directly and we will arrange a visit.</p>
    <a class="call-btn" href="tel:+263783944171">Call engineer: +263 783 944 171</a>
    <p class="muted" style="font-size:0.92rem;">Tap the button on your phone to dial Synapse Engineering.</p>
    <p><a class="back" href="/">&larr; Back to home</a></p>
  </main>
</body>
</html>`);
});

app.get("/quotation-status", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>View Quotation | Synapse Engineering</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: linear-gradient(135deg, #f5f8ff, #fff7ef); color: #1a1a1a; }
    main { width: min(840px, 94vw); margin: 0 auto; padding: 2rem 0 3rem; }
    h1, h2 { color: #241c7a; }
    .panel { background: linear-gradient(135deg, #ffffff, #f7f9ff); border-radius: 0.8rem; padding: 1.2rem; box-shadow: 0 10px 30px rgba(36,28,122,0.10); margin-top: 1rem; }
    .stack { display: grid; gap: 0.8rem; }
    label { display: block; font-weight: 700; margin-bottom: 0.35rem; }
    input { width: 100%; padding: 0.75rem; border: 1px solid #cfd4ea; border-radius: 0.5rem; font: inherit; box-sizing: border-box; }
    .button { display: inline-block; padding: 0.85rem 1rem; border-radius: 0.5rem; text-decoration: none; font-weight: 700; border: 0; cursor: pointer; }
    .primary { background: linear-gradient(135deg, #2f2ab2, #241c7a); color: white; }
    .secondary { background: linear-gradient(135deg, #d53d42, #b32025); color: white; }
    .note { background: #fff7ef; border-left: 5px solid #f0bb2d; padding: 1rem; border-radius: 0.4rem; }
    .row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.45rem 0; border-bottom: 1px solid #ececf2; }
    .total { font-size: 1.1rem; font-weight: 700; color: #241c7a; }
    .status { margin-top: 1rem; padding: 0.85rem; border-radius: 0.6rem; background: #eef3ff; color: #241c7a; }
  </style>
</head>
<body>
  <main>
    <section class="panel">
      <h1>View your quotation</h1>
      <p>Enter your quotation ID to see the latest totals, including any admin delivery changes or discounts.</p>
      <form id="lookupForm" class="stack">
        <div>
          <label for="quotationId">Quotation ID</label>
          <input id="quotationId" name="quotationId" placeholder="e.g. qt_1777893320597" required />
        </div>
        <div style="display:flex;gap:0.8rem;flex-wrap:wrap;">
          <button class="button primary" type="submit">Check quotation</button>
          <a class="button secondary" href="/shop">Back to shop</a>
        </div>
      </form>
      <div id="status" class="status" hidden></div>
    </section>
    <section id="resultPanel" class="panel" hidden>
      <h2>Latest quotation details</h2>
      <div id="resultBody"></div>
    </section>
  </main>
  <script>
    const apiBase = ${JSON.stringify(publicApiBase)};
    const lookupForm = document.getElementById("lookupForm");
    const statusEl = document.getElementById("status");
    const resultPanel = document.getElementById("resultPanel");
    const resultBody = document.getElementById("resultBody");
    const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

    function renderQuotation(data) {
      const discount = Number(data.discountAmount || 0);
      resultBody.innerHTML =
        '<div class="row"><span>Quotation ID</span><strong>' + data.quotationId + '</strong></div>' +
        '<div class="row"><span>Customer</span><strong>' + data.customerName + '</strong></div>' +
        '<div class="row"><span>Email</span><strong>' + data.email + '</strong></div>' +
        '<div class="row"><span>Phone</span><strong>' + data.phone + '</strong></div>' +
        '<div class="row"><span>Region</span><strong>' + (data.serviceArea || "N/A") + '</strong></div>' +
        '<div class="row"><span>Subtotal</span><strong>' + currency.format(Number(data.subtotal || 0)) + '</strong></div>' +
        '<div class="row"><span>Estimated delivery</span><strong>' + currency.format(Number(data.deliveryFee || 0)) + '</strong></div>' +
        '<div class="row"><span>Discount</span><strong>-' + currency.format(discount) + '</strong></div>' +
        '<div class="row total"><span>Grand total</span><strong>' + currency.format(Number(data.total || 0)) + '</strong></div>' +
        '<div class="note" style="margin-top:0.8rem;">Items: ' + data.lines.map((line) => line.name + ' x' + line.quantity).join(', ') + '</div>';
      resultPanel.hidden = false;
    }

    lookupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      resultPanel.hidden = true;
      statusEl.hidden = true;

      const quotationId = document.getElementById("quotationId").value.trim();
      if (!quotationId) {
        statusEl.hidden = false;
        statusEl.textContent = "Please enter your quotation ID.";
        return;
      }

      try {
        const response = await fetch(apiBase + "/api/quotation/" + encodeURIComponent(quotationId));
        if (!response.ok) {
          statusEl.hidden = false;
          statusEl.textContent = "Quotation not found. Check your quotation ID and try again.";
          return;
        }
        const data = await response.json();
        renderQuotation(data);
      } catch {
        statusEl.hidden = false;
        statusEl.textContent = "Could not reach the quotation service. Please try again.";
      }
    });

    const queryId = new URLSearchParams(window.location.search).get("id");
    if (queryId) {
      document.getElementById("quotationId").value = queryId;
      lookupForm.requestSubmit();
    }
  </script>
</body>
</html>`);
});

app.get("/privacy", (_req, res) => {
  res.type("html").send(renderPrivacyPage());
});

app.get("/terms", (_req, res) => {
  res.type("html").send(renderTermsPage());
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Web app running on http://localhost:${port}`);
});
