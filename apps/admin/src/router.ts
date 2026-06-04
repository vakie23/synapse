import crypto from "node:crypto";
import express from "express";
import fs from "node:fs";
import path from "node:path";

export function createAdminRouter(basePath = "") {
  const adminPath = basePath.replace(/\/$/, "");
  const router = express.Router();
  router.use(express.urlencoded({ extended: false }));

// Simple credentials file for persistence
const credentialsFile = path.join(process.cwd(), "..", "api", "..", "admin", "data", "admin-credentials.json");

function loadCredentials() {
  try {
    if (fs.existsSync(credentialsFile)) {
      return JSON.parse(fs.readFileSync(credentialsFile, "utf8"));
    }
  } catch {}
  return null;
}

function saveCredentials(username: string, password: string) {
  const dataDir = path.dirname(credentialsFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(credentialsFile, JSON.stringify({ username, password }, null, 2));
}

function getAdminCreds() {
  const saved = loadCredentials();
  return {
    username: saved?.username ?? process.env.ADMIN_USERNAME ?? "admin",
    password: saved?.password ?? process.env.ADMIN_PASSWORD ?? "Synapse@2026"
  };
}

const sessionCookieName = "synapse_admin_session";
const sessionSecret = process.env.ADMIN_SESSION_SECRET ?? "synapse-admin-secret";
const sessionMaxAgeMs = Number(process.env.ADMIN_SESSION_MAX_AGE_MS ?? 8 * 60 * 60 * 1000);
const serverApiBase = process.env.API_BASE_URL ?? "http://localhost:4000";
const adminApiKey = (process.env.ADMIN_API_KEY ?? "").trim();

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    cookies[rawKey] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

function isAuthenticated(cookieHeader?: string): boolean {
  const cookies = parseCookies(cookieHeader);
  const token = cookies[sessionCookieName];
  return Boolean(token && verifySessionToken(token));
}

function createSessionToken(username: string): string {
  const payload = `${username}:${Date.now()}`;
  const signature = crypto.createHmac("sha256", sessionSecret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

function verifySessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 3) {
      return false;
    }

    const [username, timestamp, signature] = parts;
    const issuedAt = Number(timestamp);
    if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > sessionMaxAgeMs) {
      return false;
    }
    const payload = `${username}:${timestamp}`;
    const expected = crypto.createHmac("sha256", sessionSecret).update(payload).digest("hex");
    return signature === expected && username === getAdminCreds().username;
  } catch {
    return false;
  }
}

function getServerSideAdminHeaders(contentType?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (adminApiKey) {
    headers.Authorization = `Bearer ${adminApiKey}`;
  } else {
    const creds = getAdminCreds();
    headers["x-admin-username"] = creds.username;
    headers["x-admin-password"] = creds.password;
  }
  if (contentType) {
    headers["content-type"] = contentType;
  }
  return headers;
}

function renderLoginPage(errorMessage = "", pathPrefix = adminPath): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin Login</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #f4f6fc; color: #1a1a1a; }
    main { width: min(420px, 92vw); margin: 5rem auto; background: white; padding: 1.5rem; border-radius: 0.85rem; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
    h1 { color: #241c7a; margin-top: 0; }
    label { display: block; font-weight: 700; margin-bottom: 0.35rem; }
    input { width: 100%; padding: 0.8rem; border: 1px solid #cfd4ea; border-radius: 0.5rem; margin-bottom: 1rem; box-sizing: border-box; }
    button { width: 100%; padding: 0.9rem; border: 0; border-radius: 0.5rem; background: #241c7a; color: white; font-weight: 700; cursor: pointer; }
    .error { background: #fff1f1; color: #b32025; padding: 0.8rem; border-radius: 0.5rem; margin-bottom: 1rem; }
    .hint { color: #555; font-size: 0.95rem; }
    .password-toggle { display: flex; align-items: center; gap: 0.5rem; margin: -0.25rem 0 1rem; font-size: 0.92rem; color: #333; }
    .password-toggle input { width: auto; margin: 0; }
  </style>
</head>
<body>
  <main>
    <h1>Synapse Engineering Admin</h1>
    <p class="hint">Only authorized users with credentials can access the admin side.</p>
    ${errorMessage ? `<div class="error">${errorMessage}</div>` : ""}
    <form method="post" action="${pathPrefix}/login">
      <label for="username">Username</label>
      <input id="username" name="username" required />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" required />
      <label class="password-toggle" for="showPassword">
        <input id="showPassword" type="checkbox" />
        <span>Show password</span>
      </label>
      <button type="submit">Sign in</button>
    </form>
  </main>
  <script>
    const passwordInput = document.getElementById("password");
    const showPasswordInput = document.getElementById("showPassword");
    if (passwordInput && showPasswordInput) {
      showPasswordInput.addEventListener("change", () => {
        passwordInput.type = showPasswordInput.checked ? "text" : "password";
      });
    }
  </script>
</body>
</html>`;
}

function renderAdminPage(pathPrefix = adminPath): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin Dashboard</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #f4f6fc; color: #1a1a1a; }
    main { width: min(1180px, 95vw); margin: 2rem auto; }
    .panel { background: white; border-radius: 0.85rem; padding: 1.25rem; box-shadow: 0 8px 30px rgba(0,0,0,0.06); margin-bottom: 1rem; }
    h1, h2 { color: #241c7a; }
    .actions { display: flex; gap: 1rem; flex-wrap: wrap; }
    a, button { display: inline-block; padding: 0.85rem 1rem; border-radius: 0.5rem; text-decoration: none; font-weight: 700; border: 0; cursor: pointer; }
    .primary { background: #241c7a; color: white; }
    .secondary { background: #b32025; color: white; }
    ul { padding-left: 1.2rem; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .stat { background: #f4f6fc; border-radius: 0.75rem; padding: 1rem; }
    .stat strong { display: block; font-size: 1.6rem; color: #241c7a; }
    form.inline, .stack { display: grid; gap: 0.8rem; }
    input, textarea, select { width: 100%; padding: 0.75rem; border: 1px solid #cfd4ea; border-radius: 0.5rem; box-sizing: border-box; font: inherit; }
    .list { display: grid; gap: 0.85rem; }
    .item { border: 1px solid #e6e8f5; border-radius: 0.75rem; padding: 0.95rem; background: #fafbff; }
    .item h3 { margin: 0 0 0.35rem; color: #241c7a; }
    .muted { color: #666; font-size: 0.95rem; }
    .split { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; align-items: center; }
    .status-box { margin-top: 1rem; padding: 0.9rem; border-radius: 0.6rem; background: #eef3ff; color: #241c7a; }
    .chip { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 999px; background: #eef3ff; color: #241c7a; font-size: 0.82rem; font-weight: 700; }
    code { background: #f0f2fb; padding: 0.15rem 0.35rem; border-radius: 0.3rem; }
    @media (max-width: 860px) {
      .grid, .stats { grid-template-columns: 1fr; }
    }
    .hidden { display: none; }
    details.collapsible > summary {
      cursor: pointer;
      list-style: none;
      font-weight: 700;
      color: #241c7a;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -0.15rem 0 0.75rem;
    }
    details.collapsible > summary::-webkit-details-marker { display: none; }
    details.collapsible > summary::after {
      content: "▼";
      color: #666;
      font-weight: 700;
      font-size: 0.95rem;
    }
    details.collapsible[open] > summary::after { content: "▲"; }
    .tracker { margin-top: 1rem; display: grid; gap: 0.75rem; }
    .track-row { display: grid; grid-template-columns: 1fr 1.2fr; gap: 0.75rem; }
    .track-row span:first-child { font-weight: 700; color: #241c7a; }
    .transit-map-panel {
      margin-top: 1rem; padding: 1rem 1.1rem; border-radius: 0.75rem;
      border: 2px solid #f0bb2d; background: linear-gradient(135deg, #fafbff, #fff);
    }
    .transit-map-panel h3 { margin: 0 0 0.35rem; color: #241c7a; font-size: 1.05rem; }
  #transitTrackMap {
      width: 100%; min-height: 320px; height: 320px; border-radius: 0.65rem; margin-top: 0.75rem;
      background: #eef3ff; border: 1px solid #c8d0f0;
    }
    #transitMapHint { margin: 0 0 0.5rem; font-size: 0.92rem; }
    .stat-clickable { cursor: pointer; }
    .stat-clickable:hover { background: #e8eeff; }
    .transit-order-card { cursor: pointer; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
    .transit-order-card.is-active { border-color: #241c7a; box-shadow: 0 0 0 2px rgba(36, 28, 122, 0.12); }
    .admin-map { width: 100%; height: 280px; border-radius: 0.65rem; margin-top: 0.65rem; border: 1px solid #d8dbf0; background: #eef3ff; }
    .map-legend { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin-top: 0.5rem; font-size: 0.85rem; color: #555; }
    .map-legend i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; vertical-align: middle; margin-right: 0.2rem; }
    @media (max-width: 700px) { .track-row { grid-template-columns: 1fr; } }
  </style>
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
</head>
<body>
  <main>
    <section class="panel">
      <h1>Admin Dashboard</h1>
      <div class="actions">
        <button class="primary" type="button" onclick="loadDashboard()">Refresh dashboard</button>
        <button class="secondary" type="button" onclick="document.getElementById('credentialsPanel').classList.toggle('hidden')">Change credentials</button>
        <form method="post" action="${pathPrefix}/logout">
          <button class="secondary" type="submit">Log out</button>
        </form>
      </div>
      <div id="credentialsPanel" class="panel hidden" style="margin-top: 1rem;">
        <h2>Change Admin Credentials</h2>
        <form id="credentialsForm" class="stack">
          <input name="newUsername" placeholder="New username" required />
          <input name="newPassword" type="password" placeholder="New password" required />
          <input name="confirmPassword" type="password" placeholder="Confirm new password" required />
          <button class="primary" type="submit">Update credentials</button>
        </form>
      </div>
      <div class="stats" style="margin-top: 1rem;">
        <div class="stat"><span>Total products</span><strong id="productCount">0</strong></div>
        <div class="stat"><span>Customer quotations</span><strong id="quotationCount">0</strong></div>
        <div class="stat"><span>Orders</span><strong id="orderCount">0</strong></div>
        <div class="stat stat-clickable" id="transitStatCard" title="Jump to live shipment map"><span>Goods in transit</span><strong id="transitCount">0</strong></div>
      </div>
    </section>

    <details class="panel collapsible" id="transit-section" open>
      <summary>Goods in Transit — live map</summary>
      <div class="split">
        <h2>Goods in Transit</h2>
        <span class="muted">Track shipments on the map (same as customer order tracking)</span>
      </div>
      <form id="transitTrackForm" class="stack" style="margin-top: 0.75rem;">
        <input id="transitOrderId" type="search" placeholder="Enter order ID (e.g. ord_173...)" required />
        <button class="primary" type="submit">Show on map</button>
      </form>
      <div id="transitTrackResult" class="tracker hidden"></div>
      <div class="transit-map-panel">
        <h3>Live shipment map</h3>
        <p id="transitMapHint" class="muted">Enter an order ID above, or click a shipment below, to see its location on this map.</p>
        <div id="transitTrackMap"></div>
      </div>
      <p id="transitTrackError" class="muted hidden" style="margin-top: 0.75rem;"></p>
      <h3 style="margin: 1.25rem 0 0.5rem; color: #241c7a; font-size: 1rem;">Shipments in transit</h3>
      <div id="transitList" class="list"></div>
      <p class="map-legend" style="margin-top:0.75rem;">
        <span><i style="background:#2e7d32"></i> Green = dispatch origin</span>
        <span><i style="background:#f0bb2d"></i> Gold = goods now</span>
        <span><i style="background:#b32025"></i> Red = customer address</span>
      </p>
    </details>

    <details class="panel collapsible" open>
      <summary>Dispatch origin (where goods ship from)</summary>
      <p class="muted">Set the warehouse or shop location on the map. New orders start from here.</p>
      <label for="dispatchLabel">Location name</label>
      <input id="dispatchLabel" type="text" placeholder="e.g. Synapse Engineering Harare" />
      <div id="dispatchMap" class="admin-map"></div>
      <input type="hidden" id="dispatchLat" />
      <input type="hidden" id="dispatchLng" />
      <button type="button" class="primary" id="saveDispatchBtn" style="margin-top:0.75rem;">Save dispatch location</button>
    </details>

    <div class="grid">
      <details class="panel collapsible" open>
        <summary>Add Product</summary>
        <h2>Add Product</h2>
        <form id="productForm" class="stack">
          <input name="name" placeholder="Product name" required />
          <input name="category" placeholder="Category" required />
          <input name="price" type="number" min="0.01" step="0.01" placeholder="Price" required />
          <input name="stock" type="number" min="0" step="1" placeholder="Stock quantity" required />
          <textarea name="description" rows="3" placeholder="Description" required></textarea>
          <input name="image" type="file" accept="image/*" placeholder="Product image (optional)" />
          <button class="primary" type="submit">Save product</button>
        </form>
      </details>
      <details class="panel collapsible" open>
        <summary>Update delivery on map</summary>
        <h2>Update delivery on map</h2>
        <p class="muted">Move the pin to where the goods are now and set expected arrival for the customer.</p>
        <form id="statusForm" class="stack">
          <input name="orderId" id="statusOrderId" placeholder="Order ID" required />
          <select name="status">
            <option value="PENDING_PAYMENT">Pending payment</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <input name="stage" placeholder="Stage (e.g. On the way to customer)" />
          <input name="currentLocation" id="statusLocationText" placeholder="Location description" />
          <label for="statusEta">Expected arrival (customer sees this)</label>
          <input name="expectedArrivalAt" id="statusEta" type="datetime-local" />
          <p class="muted">Tap the map to set where the shipment is right now:</p>
          <div id="statusMap" class="admin-map"></div>
          <input type="hidden" id="statusLat" name="statusLat" />
          <input type="hidden" id="statusLng" name="statusLng" />
          <button class="secondary" type="submit">Update order on map</button>
        </form>
      </details>
    </div>
    <div class="grid">
      <details class="panel collapsible" open>
        <summary>Products</summary>
        <div class="split">
          <h2>Products</h2>
          <span class="muted">Inventory currently available</span>
        </div>
        <div class="actions" style="margin-top: 0.8rem;">
          <input id="productSearch" type="search" placeholder="Search products by name, category, or description" />
          <button id="productSearchBtn" class="primary" type="button">Search</button>
        </div>
        <div id="productsList" class="list"></div>
      </details>
      <details class="panel collapsible" open>
        <summary>Quotations</summary>
        <div class="split">
          <h2>Quotations</h2>
          <span class="muted">Saved customer quotation requests</span>
        </div>
        <div class="actions" style="margin-top: 0.8rem;">
          <input id="quotationSearch" type="search" placeholder="Search quotations by customer, ID, phone, or email" />
          <button id="quotationSearchBtn" class="primary" type="button">Search</button>
        </div>
        <div id="quotationsList" class="list"></div>
      </details>
    </div>
    <details class="panel collapsible" open>
      <summary>Orders and Delivery</summary>
      <div class="split">
        <h2>Orders and Delivery</h2>
        <span class="muted">Track and manage order progress</span>
      </div>
      <div id="ordersList" class="list"></div>
    </details>
    <div id="dashboardStatus" class="status-box" hidden></div>
  </main>
  <script>
    const adminApiProxyBase = ${JSON.stringify(`${pathPrefix}/api-proxy`.replace(/\/+/g, "/"))};
    const dashboardStatus = document.getElementById("dashboardStatus");
    const productForm = document.getElementById("productForm");
    const statusForm = document.getElementById("statusForm");
    const credentialsForm = document.getElementById("credentialsForm");
    const productSearchInput = document.getElementById("productSearch");
    const productSearchBtn = document.getElementById("productSearchBtn");
    const quotationSearchInput = document.getElementById("quotationSearch");
    const quotationSearchBtn = document.getElementById("quotationSearchBtn");
    let allProducts = [];
    let allQuotations = [];
    let allOrders = [];
    let dispatchSettings = { label: "Synapse Engineering dispatch", lat: -17.8252, lng: 31.0335 };
    let transitMap = null;
    let transitRouteLayer = null;
    let transitMapLayerGroup = null;
    let statusMap = null;
    let statusMarker = null;
    let dispatchMap = null;
    let dispatchMarker = null;
    let activeTransitOrderId = "";

    function mapPin(color) {
      return L.divIcon({
        className: "",
        html: '<span style="display:block;width:12px;height:12px;border-radius:50%;background:' + color + ';border:2px solid #fff"></span>',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });
    }

    function toDatetimeLocalValue(iso) {
      if (!iso) return "";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "";
      const pad = (n) => String(n).padStart(2, "0");
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
    }

    function initDispatchMap() {
      const el = document.getElementById("dispatchMap");
      if (!el) return;
      if (dispatchMap) {
        dispatchMarker.setLatLng([dispatchSettings.lat, dispatchSettings.lng]);
        dispatchMap.setView([dispatchSettings.lat, dispatchSettings.lng], 13);
        document.getElementById("dispatchLabel").value = dispatchSettings.label || "";
        document.getElementById("dispatchLat").value = String(dispatchSettings.lat);
        document.getElementById("dispatchLng").value = String(dispatchSettings.lng);
        return;
      }
      dispatchMap = L.map("dispatchMap").setView([dispatchSettings.lat, dispatchSettings.lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(dispatchMap);
      dispatchMarker = L.marker([dispatchSettings.lat, dispatchSettings.lng], { draggable: true }).addTo(dispatchMap);
      document.getElementById("dispatchLabel").value = dispatchSettings.label || "";
      document.getElementById("dispatchLat").value = String(dispatchSettings.lat);
      document.getElementById("dispatchLng").value = String(dispatchSettings.lng);
      const syncDispatch = (lat, lng) => {
        document.getElementById("dispatchLat").value = String(Number(lat).toFixed(6));
        document.getElementById("dispatchLng").value = String(Number(lng).toFixed(6));
      };
      dispatchMarker.on("dragend", () => {
        const p = dispatchMarker.getLatLng();
        syncDispatch(p.lat, p.lng);
      });
      dispatchMap.on("click", (e) => {
        dispatchMarker.setLatLng(e.latlng);
        syncDispatch(e.latlng.lat, e.latlng.lng);
      });
      setTimeout(() => dispatchMap.invalidateSize(), 200);
    }

    function initStatusMap(lat, lng) {
      const el = document.getElementById("statusMap");
      if (!el) return;
      const startLat = lat ?? dispatchSettings.lat;
      const startLng = lng ?? dispatchSettings.lng;
      if (!statusMap) {
        statusMap = L.map("statusMap").setView([startLat, startLng], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors"
        }).addTo(statusMap);
        statusMarker = L.marker([startLat, startLng], { draggable: true }).addTo(statusMap);
        statusMarker.on("dragend", () => {
          const p = statusMarker.getLatLng();
          document.getElementById("statusLat").value = String(Number(p.lat).toFixed(6));
          document.getElementById("statusLng").value = String(Number(p.lng).toFixed(6));
        });
        statusMap.on("click", (e) => {
          statusMarker.setLatLng(e.latlng);
          document.getElementById("statusLat").value = String(Number(e.latlng.lat).toFixed(6));
          document.getElementById("statusLng").value = String(Number(e.latlng.lng).toFixed(6));
        });
      } else {
        statusMap.setView([startLat, startLng], 13);
        statusMarker.setLatLng([startLat, startLng]);
      }
      document.getElementById("statusLat").value = String(Number(startLat).toFixed(6));
      document.getElementById("statusLng").value = String(Number(startLng).toFixed(6));
      setTimeout(() => statusMap.invalidateSize(), 200);
    }

    function drawOrderOnMap(order) {
      const el = document.getElementById("transitTrackMap");
      if (!el || !order) return;
      const tracking = order.tracking || {};
      const origin = tracking.origin || { lat: dispatchSettings.lat, lng: dispatchSettings.lng, label: dispatchSettings.label };
      const dest = order.customerLocation;
      const current = tracking.coordinates;
      if (!dest || !current || !Number.isFinite(current.lat)) return;

      el.innerHTML = "";
      transitMap = L.map("transitTrackMap");
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(transitMap);
      transitMapLayerGroup = L.layerGroup().addTo(transitMap);
      const points = [[origin.lat, origin.lng], [current.lat, current.lng], [dest.lat, dest.lng]];
      transitRouteLayer = L.polyline(points, { color: "#241c7a", weight: 4, dashArray: "10 8" }).addTo(transitMapLayerGroup);
      L.marker([origin.lat, origin.lng], { icon: mapPin("#2e7d32") }).addTo(transitMapLayerGroup).bindPopup("Dispatch: " + (origin.label || ""));
      L.marker([current.lat, current.lng], { icon: mapPin("#f0bb2d") }).addTo(transitMapLayerGroup).bindPopup(tracking.currentLocation || "In transit");
      L.marker([dest.lat, dest.lng], { icon: mapPin("#b32025") }).addTo(transitMapLayerGroup).bindPopup("Customer address");
      transitMap.fitBounds(transitRouteLayer.getBounds(), { padding: [24, 24] });
      setTimeout(() => { if (transitMap) transitMap.invalidateSize(); }, 200);
    }

    function showStatus(message) {
      dashboardStatus.hidden = false;
      dashboardStatus.textContent = message;
    }

    function resolveImageUrl(imageUrl) {
      const raw = String(imageUrl || "").trim();
      if (!raw) return "";
      if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
      return adminApiProxyBase + (raw.startsWith("/") ? raw : ("/" + raw));
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    async function apiFetch(path, options = {}) {
      const { headers: optHeaders = {}, ...rest } = options;
      const method = String(rest.method || "GET").toUpperCase();
      const merged = { ...(optHeaders || {}) };
      if (!["GET", "HEAD", "DELETE"].includes(method) && merged["Content-Type"] === undefined) {
        merged["Content-Type"] = "application/json";
      }
      const response = await fetch(adminApiProxyBase + path, {
        credentials: "include",
        headers: merged,
        ...rest
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Request failed");
      }

      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        return null;
      }

      return response.json();
    }

    function renderProducts(products, query = "") {
      const normalizedQuery = String(query || "").trim().toLowerCase();
      const filtered = normalizedQuery
        ? products.filter((product) => {
            return [product.name, product.category, product.description]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(normalizedQuery));
          })
        : products;
      document.getElementById("productCount").textContent = String(filtered.length);
      if (!filtered.length) {
        document.getElementById("productsList").innerHTML = '<div class="muted">No products match your search.</div>';
        return;
      }
      document.getElementById("productsList").innerHTML = filtered.map((product) => {
        const imgUrl = resolveImageUrl(product.imageUrl);
        const img = imgUrl ? '<img src="' + imgUrl + '" style="width:100%;height:200px;object-fit:cover;border-radius:0.5rem;margin-bottom:0.5rem;" />' : '';
        return '<article class="item" data-product-item="' + product.id + '">' +
          img +
          '<h3>' + product.name + '</h3>' +
          '<div class="muted">' + product.category + '</div>' +
          '<div>Price: <strong>$' + Number(product.price).toFixed(2) + '</strong></div>' +
          '<div>Stock: <strong>' + product.stock + '</strong></div>' +
          '<div class="muted">' + product.description + '</div>' +
          '<div class="actions" style="margin-top:0.5rem;">' +
            '<button class="secondary product-edit-btn" data-product-id="' + product.id + '" type="button" style="padding:0.5rem 0.75rem;font-size:0.9rem;">Edit</button>' +
            '<button class="secondary product-delete-btn" data-product-id="' + product.id + '" type="button" style="padding:0.5rem 0.75rem;font-size:0.9rem;">Delete</button>' +
          '</div>' +
          '<form class="product-inline-edit-form stack hidden" data-product-id="' + product.id + '" style="margin-top:0.75rem;">' +
            '<input name="name" value="' + escapeHtml(product.name) + '" placeholder="Product name" required />' +
            '<input name="category" value="' + escapeHtml(product.category) + '" placeholder="Category" required />' +
            '<input name="price" type="number" min="0.01" step="0.01" value="' + Number(product.price).toFixed(2) + '" placeholder="Price" required />' +
            '<input name="stock" type="number" min="0" step="1" value="' + Number(product.stock) + '" placeholder="Stock quantity" required />' +
            '<textarea name="description" rows="3" placeholder="Description" required>' + escapeHtml(product.description) + '</textarea>' +
            '<input name="image" type="file" accept="image/*" />' +
            '<div class="actions">' +
              '<button class="primary" type="submit">Update product</button>' +
              '<button class="secondary product-edit-cancel-btn" type="button">Cancel</button>' +
            '</div>' +
          '</form>' +
        '</article>';
      }).join("");
    }

    function renderQuotations(quotations, query = "") {
      const normalizedQuery = String(query || "").trim().toLowerCase();
      const filtered = normalizedQuery
        ? quotations.filter((quotation) => {
            return [quotation.customerName, quotation.quotationId, quotation.phone, quotation.email]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(normalizedQuery));
          })
        : quotations;
      document.getElementById("quotationCount").textContent = String(filtered.length);
      if (!filtered.length) {
        document.getElementById("quotationsList").innerHTML = '<div class="muted">No quotations yet.</div>';
        return;
      }
      document.getElementById("quotationsList").innerHTML = filtered.map((quotation) => {
        const discountAmount = Number(quotation.discountAmount || 0);
        const location = quotation.customerLocation || {};
        const lat = Number(location.lat);
        const lng = Number(location.lng);
        const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
        const mapLink = hasLocation ? ('<div><a class="primary" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps?q=' + lat + ',' + lng + '">Open customer location</a></div>') : "";
        const renderedItems = quotation.lines.map((line) => {
          const lineImgUrl = resolveImageUrl(line.imageUrl);
          const lineImage = lineImgUrl
            ? ('<img src="' + lineImgUrl + '" alt="' + line.name + '" style="width:48px;height:48px;object-fit:cover;border-radius:0.35rem;" />')
            : '<div style="width:48px;height:48px;border-radius:0.35rem;background:#f3f4f6;"></div>';
          return '<div class="split" style="gap:0.65rem;align-items:center;justify-content:flex-start;margin-top:0.45rem;">' +
            lineImage +
            '<div><div><strong>' + line.name + '</strong> x' + line.quantity + '</div><div class="muted">$' + Number(line.unitPrice).toFixed(2) + ' each</div></div>' +
          '</div>';
        }).join("");

        return '<article class="item">' +
          '<div class="split"><h3>' + quotation.customerName + '</h3><strong>$' + Number(quotation.total).toFixed(2) + '</strong></div>' +
          '<div class="muted">Quotation ID: ' + quotation.quotationId + '</div>' +
          '<div>Email: ' + quotation.email + '</div>' +
          '<div>Phone: ' + quotation.phone + '</div>' +
          '<div>Region: ' + (quotation.serviceArea || "N/A") + '</div>' +
          '<div>Required date: ' + quotation.requiredDate + '</div>' +
          '<div>Address: ' + quotation.physicalAddress + '</div>' +
          '<div>Coordinates: ' + (hasLocation ? (lat.toFixed(5) + ", " + lng.toFixed(5)) : "N/A") + '</div>' +
          mapLink +
          '<div style="margin-top:0.5rem;"><strong>Items</strong>' + renderedItems + '</div>' +
          '<div>Subtotal: <strong>$' + Number(quotation.subtotal).toFixed(2) + '</strong></div>' +
          '<div>Estimated delivery: <strong>$' + Number(quotation.deliveryFee).toFixed(2) + '</strong></div>' +
          '<div>Discount: <strong>$' + discountAmount.toFixed(2) + '</strong></div>' +
          '<form class="quotation-adjust-form stack" data-quotation-id="' + quotation.quotationId + '" style="margin-top:0.75rem;">' +
            '<label>Update estimated delivery fee' +
              '<input name="deliveryFee" type="number" min="0" step="0.01" value="' + Number(quotation.deliveryFee).toFixed(2) + '" required />' +
            '</label>' +
            '<label>Offer discount amount' +
              '<input name="discountAmount" type="number" min="0" step="0.01" value="' + discountAmount.toFixed(2) + '" required />' +
            '</label>' +
            '<div class="actions">' +
              '<button class="secondary" type="submit">Apply delivery/discount</button>' +
              '<button class="secondary quotation-delete-btn" type="button" data-quotation-id="' + quotation.quotationId + '">Delete quotation</button>' +
            '</div>' +
          '</form>' +
        '</article>';
      }).join("");
    }

    function renderOrders(orders) {
      document.getElementById("orderCount").textContent = String(orders.length);
      if (!orders.length) {
        document.getElementById("ordersList").innerHTML = '<div class="muted">No orders yet.</div>';
        return;
      }
      document.getElementById("ordersList").innerHTML = orders.map((order) => {
        return '<article class="item"><div class="split"><h3>' + order.customerName + '</h3><strong>' + order.status + '</strong></div><div class="muted">Order ID: ' + order.id + '</div><div>Phone: ' + order.phone + '</div><div>City: ' + order.city + '</div><div>Address: ' + order.address + '</div><div>Total: <strong>$' + Number(order.total).toFixed(2) + '</strong></div><div>Tracking stage: ' + order.tracking.stage + '</div><div>Current location: ' + order.tracking.currentLocation + '</div></article>';
      }).join("");
    }

    function showTransitTracking(order) {
      const transitTrackResult = document.getElementById("transitTrackResult");
      const transitTrackError = document.getElementById("transitTrackError");
      const transitTrackMapEl = document.getElementById("transitTrackMap");

      if (!order || !order.tracking) {
        transitTrackResult.classList.add("hidden");
        transitTrackError.classList.remove("hidden");
        transitTrackError.textContent = "Order not found. Please verify the order ID.";
        if (transitTrackMapEl) transitTrackMapEl.innerHTML = "";
        return;
      }

      const tracking = order.tracking;
      const eta = tracking.expectedArrivalAt
        ? new Date(tracking.expectedArrivalAt).toLocaleString()
        : "Not set yet";
      const origin = tracking.origin || dispatchSettings;

      transitTrackError.classList.add("hidden");
      transitTrackResult.classList.remove("hidden");
      transitTrackResult.innerHTML =
        '<div class="track-row"><span>Order ID</span><span>' + escapeHtml(order.id || "N/A") + '</span></div>' +
        '<div class="track-row"><span>Shipped from</span><span>' + escapeHtml(origin.label || "Dispatch") + '</span></div>' +
        '<div class="track-row"><span>Current stage</span><span>' + escapeHtml(tracking.stage || "N/A") + '</span></div>' +
        '<div class="track-row"><span>Current location</span><span>' + escapeHtml(tracking.currentLocation || "N/A") + '</span></div>' +
        '<div class="track-row"><span>Expected arrival</span><span>' + escapeHtml(eta) + '</span></div>' +
        '<div class="track-row"><span>Last updated</span><span>' + (tracking.updatedAt ? new Date(tracking.updatedAt).toLocaleString() : "N/A") + '</span></div>';

      const transitMapHint = document.getElementById("transitMapHint");
      if (transitMapHint) transitMapHint.textContent = "Route: dispatch → goods now → customer";
      if (order.customerLocation && tracking.coordinates) {
        drawOrderOnMap(order);
      } else if (transitTrackMapEl) {
        transitTrackMapEl.innerHTML = '<div style="padding:1rem;text-align:center;color:#666;">Missing customer or shipment coordinates.</div>';
      }
    }

    function renderTransit(orders) {
      const transitOrders = orders.filter((order) => {
        const status = String(order.status || "");
        return status !== "DELIVERED" && status !== "CANCELLED";
      });

      document.getElementById("transitCount").textContent = String(transitOrders.length);
      const transitListEl = document.getElementById("transitList");
      if (!transitOrders.length) {
        transitListEl.innerHTML = '<div class="muted">No goods currently in transit.</div>';
        document.getElementById("transitTrackResult").classList.add("hidden");
        document.getElementById("transitTrackMap").style.display = "none";
        return;
      }

      transitListEl.innerHTML = transitOrders.map((order) => {
        const tracking = order.tracking || {};
        const isActive = order.id === activeTransitOrderId ? " is-active" : "";
        return '<article class="item transit-order-card' + isActive + '" data-order-id="' + escapeHtml(order.id) + '">' +
          '<div class="split"><h3>' + escapeHtml(order.customerName) + '</h3><span class="chip">' + escapeHtml(order.status) + '</span></div>' +
          '<div class="muted">Order ID: ' + escapeHtml(order.id) + '</div>' +
          '<div>Stage: <strong>' + escapeHtml(tracking.stage || "N/A") + '</strong></div>' +
          '<div>Current location: <strong>' + escapeHtml(tracking.currentLocation || "N/A") + '</strong></div>' +
        '</article>';
      }).join("");

      transitListEl.querySelectorAll(".transit-order-card").forEach((card) => {
        card.addEventListener("click", () => {
          const orderId = card.getAttribute("data-order-id");
          const order = allOrders.find((item) => item.id === orderId);
          activeTransitOrderId = orderId || "";
          transitListEl.querySelectorAll(".transit-order-card").forEach((node) => node.classList.remove("is-active"));
          card.classList.add("is-active");
          document.getElementById("transitOrderId").value = orderId || "";
          showTransitTracking(order);
        });
      });

      const selected = transitOrders.find((order) => order.id === activeTransitOrderId) || transitOrders[0];
      activeTransitOrderId = selected.id;
      document.getElementById("transitOrderId").value = selected.id;
      showTransitTracking(selected);
    }

    async function loadDashboard() {
      try {
        const [productsResult, quotationsResult, ordersResult, dispatchResult] = await Promise.allSettled([
          apiFetch("/api/products"),
          apiFetch("/api/admin/quotations"),
          apiFetch("/api/admin/orders"),
          apiFetch("/api/admin/dispatch-settings")
        ]);

        const products = productsResult.status === "fulfilled" && Array.isArray(productsResult.value)
          ? productsResult.value
          : [];
        const quotations = quotationsResult.status === "fulfilled" && Array.isArray(quotationsResult.value)
          ? quotationsResult.value
          : [];
        const orders = ordersResult.status === "fulfilled" && Array.isArray(ordersResult.value)
          ? ordersResult.value
          : [];

        if (dispatchResult.status === "fulfilled" && dispatchResult.value) {
          dispatchSettings = dispatchResult.value;
        }
        allProducts = products;
        allQuotations = quotations;
        allOrders = orders;
        initDispatchMap();
        initStatusMap();
        renderProducts(products, productSearchInput.value);
        renderQuotations(quotations, quotationSearchInput.value);
        renderTransit(orders);
        renderOrders(orders);

        const partialFailures = [];
        if (productsResult.status === "rejected") partialFailures.push("products");
        if (quotationsResult.status === "rejected") partialFailures.push("quotations");
        if (ordersResult.status === "rejected") partialFailures.push("orders");
        if (partialFailures.length === 0) {
          showStatus("Dashboard refreshed successfully.");
        } else {
          showStatus("Dashboard partially loaded. Could not load: " + partialFailures.join(", ") + ".");
        }
      } catch (error) {
        showStatus("Could not load dashboard data. Please log in again if your session expired.");
      }
    }

    productForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(productForm);
      
      try {
        const response = await fetch(adminApiProxyBase + "/api/admin/products", {
          method: "POST",
          credentials: "include",
          body: formData
        });

        if (response.ok) {
          productForm.reset();
          await loadDashboard();
          showStatus("Product saved. It is now live on the shop page.");
        } else {
          showStatus("Could not save product. Please check the values and try again.");
        }
      } catch {
        showStatus("Could not save product. Please check the values and try again.");
      }
    });

    statusForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(statusForm);
      const orderId = String(formData.get("orderId"));
      const lat = Number(document.getElementById("statusLat").value);
      const lng = Number(document.getElementById("statusLng").value);
      const etaRaw = document.getElementById("statusEta").value;
      const payload = {
        status: String(formData.get("status")),
        stage: String(formData.get("stage") || ""),
        currentLocation: String(formData.get("currentLocation") || ""),
        coordinates: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined,
        expectedArrivalAt: etaRaw ? new Date(etaRaw).toISOString() : undefined
      };

      try {
        await apiFetch("/api/admin/orders/" + encodeURIComponent(orderId) + "/status", {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        statusForm.reset();
        await loadDashboard();
        showStatus("Order updated. Customer sees route, location, and expected arrival on Track order.");
      } catch {
        showStatus("Could not update that order. Check the order ID and try again.");
      }
    });

    document.getElementById("saveDispatchBtn").addEventListener("click", async () => {
      const label = String(document.getElementById("dispatchLabel").value || "").trim();
      const lat = Number(document.getElementById("dispatchLat").value);
      const lng = Number(document.getElementById("dispatchLng").value);
      if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        showStatus("Set a location name and pick a point on the dispatch map.");
        return;
      }
      try {
        const saved = await apiFetch("/api/admin/dispatch-settings", {
          method: "PUT",
          body: JSON.stringify({ label, lat, lng })
        });
        dispatchSettings = saved;
        showStatus("Dispatch origin saved. New orders will ship from this location.");
      } catch {
        showStatus("Could not save dispatch location.");
      }
    });

    document.getElementById("transitList").addEventListener("click", (event) => {
      const card = event.target.closest(".transit-order-card");
      if (!card) return;
      const order = allOrders.find((item) => item.id === card.getAttribute("data-order-id"));
      if (!order) return;
      document.getElementById("statusOrderId").value = order.id;
      const t = order.tracking || {};
      document.getElementById("statusLocationText").value = t.currentLocation || "";
      document.getElementById("statusEta").value = toDatetimeLocalValue(t.expectedArrivalAt);
      if (t.coordinates) initStatusMap(t.coordinates.lat, t.coordinates.lng);
    });

    document.getElementById("quotationsList").addEventListener("submit", async (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.classList.contains("quotation-adjust-form")) {
        return;
      }
      event.preventDefault();

      const quotationId = form.getAttribute("data-quotation-id");
      if (!quotationId) {
        showStatus("Missing quotation ID. Refresh and try again.");
        return;
      }

      const formData = new FormData(form);
      const deliveryFee = Number(formData.get("deliveryFee"));
      const discountAmount = Number(formData.get("discountAmount"));

      if (Number.isNaN(deliveryFee) || deliveryFee < 0 || Number.isNaN(discountAmount) || discountAmount < 0) {
        showStatus("Enter valid non-negative numbers for delivery and discount.");
        return;
      }

      try {
        await apiFetch("/api/admin/quotations/" + encodeURIComponent(quotationId), {
          method: "PATCH",
          body: JSON.stringify({ deliveryFee, discountAmount })
        });
        await loadDashboard();
        showStatus("Quotation updated. Customer totals on the website reflect this when they view their quotation.");
      } catch {
        showStatus("Could not update quotation. Please try again.");
      }
    });

    document.getElementById("quotationsList").addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const button = target.closest(".quotation-delete-btn");
      if (!(button instanceof HTMLElement)) {
        return;
      }

      const quotationId = button.getAttribute("data-quotation-id");
      if (!quotationId) {
        showStatus("Missing quotation ID. Refresh and try again.");
        return;
      }

      const confirmed = window.confirm("Delete this quotation permanently?");
      if (!confirmed) {
        return;
      }

      try {
        await apiFetch("/api/admin/quotations/" + encodeURIComponent(quotationId), {
          method: "DELETE"
        });
        await loadDashboard();
        showStatus("Quotation deleted successfully.");
      } catch {
        showStatus("Could not delete quotation. Please try again.");
      }
    });

    document.getElementById("productsList").addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const editButton = target.closest(".product-edit-btn");
      if (editButton instanceof HTMLElement) {
        const editProductId = editButton.getAttribute("data-product-id");
        if (!editProductId) {
          showStatus("Missing product ID. Refresh and try again.");
          return;
        }
        const allEditForms = document.querySelectorAll(".product-inline-edit-form");
        allEditForms.forEach((form) => {
          if (!(form instanceof HTMLElement)) return;
          if (form.getAttribute("data-product-id") === editProductId) {
            form.classList.toggle("hidden");
          } else {
            form.classList.add("hidden");
          }
        });
        return;
      }

      const cancelEditButton = target.closest(".product-edit-cancel-btn");
      if (cancelEditButton instanceof HTMLElement) {
        const editForm = cancelEditButton.closest(".product-inline-edit-form");
        if (editForm instanceof HTMLElement) {
          editForm.classList.add("hidden");
        }
        return;
      }

      const deleteButton = target.closest(".product-delete-btn");
      if (!(deleteButton instanceof HTMLElement)) {
        return;
      }

      const productId = deleteButton.getAttribute("data-product-id");
      if (!productId) {
        showStatus("Missing product ID. Refresh and try again.");
        return;
      }

      const confirmed = window.confirm("Delete this product permanently?");
      if (!confirmed) {
        return;
      }

      try {
        await apiFetch("/api/admin/products/" + encodeURIComponent(productId), {
          method: "DELETE"
        });
        await loadDashboard();
        showStatus("Product deleted. It is removed from the website quotation page.");
      } catch (error) {
        showStatus("Could not delete product. " + (error && error.message ? error.message : "Please try again."));
      }
    });

    document.getElementById("productsList").addEventListener("submit", async (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.classList.contains("product-inline-edit-form")) {
        return;
      }
      event.preventDefault();

      const productId = form.getAttribute("data-product-id");
      if (!productId) {
        showStatus("Missing product ID. Refresh and try again.");
        return;
      }

      const formData = new FormData(form);
      try {
        const response = await fetch(adminApiProxyBase + "/api/admin/products/" + encodeURIComponent(productId), {
          method: "PATCH",
          credentials: "include",
          body: formData
        });

        if (response.ok) {
          await loadDashboard();
          showStatus("Product updated. Changes are live on the shop page.");
        } else {
          showStatus("Could not update product. Please check the values and try again.");
        }
      } catch {
        showStatus("Could not update product. Please try again.");
      }
    });

    function applyProductSearch() {
      renderProducts(allProducts, productSearchInput.value);
    }

    function applyQuotationSearch() {
      renderQuotations(allQuotations, quotationSearchInput.value);
    }

    productSearchBtn.addEventListener("click", applyProductSearch);
    quotationSearchBtn.addEventListener("click", applyQuotationSearch);
    productSearchInput.addEventListener("input", applyProductSearch);
    quotationSearchInput.addEventListener("input", applyQuotationSearch);

    credentialsForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(credentialsForm);
      const newPassword = String(formData.get("newPassword"));
      const confirmPassword = String(formData.get("confirmPassword"));

      if (newPassword !== confirmPassword) {
        showStatus("Passwords do not match. Please try again.");
        return;
      }

      if (newPassword.length < 4) {
        showStatus("Password must be at least 4 characters.");
        return;
      }

      try {
        await apiFetch("/api/admin/credentials", {
          method: "POST",
          body: JSON.stringify({
            newUsername: String(formData.get("newUsername")),
            newPassword: newPassword
          })
        });
        credentialsForm.reset();
        showStatus("Credentials updated successfully. Please log in again.");
        setTimeout(() => window.location.href = "/logout", 1500);
      } catch {
        showStatus("Could not update credentials. Please try again.");
      }
    });


    document.getElementById("transitTrackForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const orderId = String(document.getElementById("transitOrderId").value || "").trim();
      if (!orderId) return;

      const localOrder = allOrders.find((order) => order.id === orderId);
      if (localOrder) {
        activeTransitOrderId = orderId;
        showTransitTracking(localOrder);
        document.querySelectorAll(".transit-order-card").forEach((card) => {
          card.classList.toggle("is-active", card.getAttribute("data-order-id") === orderId);
        });
        return;
      }

      try {
        const data = await apiFetch("/api/orders/" + encodeURIComponent(orderId) + "/tracking");
        activeTransitOrderId = orderId;
        showTransitTracking({ id: orderId, tracking: data.tracking });
      } catch {
        showTransitTracking(null);
      }
    });

    document.getElementById("transitStatCard").addEventListener("click", () => {
      const section = document.getElementById("transit-section");
      if (section) {
        section.open = true;
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    loadDashboard();
  </script>
</body>
</html>`;
}

router.get("/", (req, res) => {
  if (!isAuthenticated(req.headers.cookie)) {
    res.status(401).type("html").send(renderLoginPage());
    return;
  }

  res.type("html").send(renderAdminPage(adminPath));
});

router.use("/api-proxy", (req, res, next) => {
  if (!isAuthenticated(req.headers.cookie)) {
    res.status(401).json({ message: "Admin authentication required" });
    return;
  }
  next();
});

router.use("/api-proxy", express.raw({ type: () => true, limit: "15mb" }), async (req, res) => {
  try {
    const targetPath = req.url.startsWith("/") ? req.url : `/${req.url}`;
    const response = await fetch(`${serverApiBase}${targetPath}`, {
      method: req.method,
      headers: getServerSideAdminHeaders(typeof req.headers["content-type"] === "string" ? req.headers["content-type"] : undefined),
      body: ["GET", "HEAD"].includes(String(req.method).toUpperCase()) ? undefined : req.body
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "transfer-encoding") {
        return;
      }
      res.setHeader(key, value);
    });
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error("admin api proxy error", error);
    res.status(502).json({ message: "Could not reach API" });
  }
});

router.post("/login", (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  const expected = getAdminCreds();
  if (username !== expected.username || password !== expected.password) {
    res.status(401).type("html").send(renderLoginPage("Invalid username or password."));
    return;
  }

  const token = createSessionToken(username!);
  res.setHeader("Set-Cookie", `${sessionCookieName}=${token}; HttpOnly; Path=/; SameSite=Lax`);
  res.redirect(adminPath || "/");
});

router.post("/logout", (_req, res) => {
  res.setHeader("Set-Cookie", `${sessionCookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
  res.redirect(adminPath || "/");
});

  return router;
}
