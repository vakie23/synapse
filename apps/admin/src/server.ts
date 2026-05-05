import crypto from "node:crypto";
import express from "express";
import fs from "node:fs";
import path from "node:path";

const app = express();
app.use(express.urlencoded({ extended: false }));

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
    const payload = `${username}:${timestamp}`;
    const expected = crypto.createHmac("sha256", sessionSecret).update(payload).digest("hex");
    return signature === expected && username === getAdminCreds().username;
  } catch {
    return false;
  }
}

function renderLoginPage(errorMessage = ""): string {
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
  </style>
</head>
<body>
  <main>
    <h1>Synapse Engineering Admin</h1>
    <p class="hint">Only authorized users with credentials can access the admin side.</p>
    ${errorMessage ? `<div class="error">${errorMessage}</div>` : ""}
    <form method="post" action="/login">
      <label for="username">Username</label>
      <input id="username" name="username" required />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" required />
      <button type="submit">Sign in</button>
    </form>
  </main>
</body>
</html>`;
}

function renderAdminPage(): string {
  const { username: credUser, password: credPass } = getAdminCreds();
  const adminApiKey = (process.env.ADMIN_API_KEY ?? "").trim();
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin Dashboard</title>
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
  </style>
</head>
<body>
  <main>
    <details class="panel collapsible" open>
      <summary>Dashboard Overview</summary>
      <h1>Admin Dashboard</h1>
      <div class="actions">
        <button class="primary" type="button" onclick="loadDashboard()">Refresh dashboard</button>
        <button class="secondary" type="button" onclick="document.getElementById('credentialsPanel').classList.toggle('hidden')">Change credentials</button>
        <form method="post" action="/logout">
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
        <div class="stat"><span>Goods in transit</span><strong id="transitCount">0</strong></div>
      </div>
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
      <details class="panel collapsible">
        <summary>Edit Product</summary>
        <h2>Edit Product</h2>
        <form id="editProductForm" class="stack">
          <input name="productId" type="hidden" required />
          <input name="name" placeholder="Product name" />
          <input name="category" placeholder="Category" />
          <input name="price" type="number" min="0.01" step="0.01" placeholder="Price" />
          <input name="stock" type="number" min="0" step="1" placeholder="Stock quantity" />
          <textarea name="description" rows="3" placeholder="Description"></textarea>
          <input name="image" type="file" accept="image/*" placeholder="Product image (optional)" />
          <button class="primary" type="submit">Update product</button>
        </form>
      </details>
      <details class="panel collapsible">
        <summary>Update Delivery Status</summary>
        <h2>Update Delivery Status</h2>
        <form id="statusForm" class="stack">
          <input name="orderId" placeholder="Order ID" required />
          <select name="status">
            <option value="PENDING_PAYMENT">Pending payment</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <input name="stage" placeholder="Stage description" />
          <input name="currentLocation" placeholder="Current location" />
          <button class="secondary" type="submit">Update order status</button>
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
      <summary>Goods in Transit</summary>
      <div class="split">
        <h2>Goods in Transit</h2>
        <span class="muted">Active shipments currently on the road</span>
      </div>
      <div id="transitList" class="list"></div>
    </details>
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
    const apiBase = "${process.env.API_BASE_URL ?? "http://localhost:4000"}";
    const adminApiKeyValue = ${JSON.stringify(adminApiKey)};
    const adminApiUsername = ${JSON.stringify(credUser)};
    const adminApiPassword = ${JSON.stringify(credPass)};
    const dashboardStatus = document.getElementById("dashboardStatus");
    const productForm = document.getElementById("productForm");
    const editProductForm = document.getElementById("editProductForm");
    const statusForm = document.getElementById("statusForm");
    const credentialsForm = document.getElementById("credentialsForm");
    const productSearchInput = document.getElementById("productSearch");
    const productSearchBtn = document.getElementById("productSearchBtn");
    const quotationSearchInput = document.getElementById("quotationSearch");
    const quotationSearchBtn = document.getElementById("quotationSearchBtn");
    let allProducts = [];
    let allQuotations = [];

    function populateEditForm(productId, productName) {
      document.getElementById("editProductForm").elements["productId"].value = productId;
      showStatus("Select fields to update for: " + productName);
    }

    function showStatus(message) {
      dashboardStatus.hidden = false;
      dashboardStatus.textContent = message;
    }

    function getAdminAuthHeaders(extraHeaders = {}) {
      if (adminApiKeyValue) {
        return {
          ...extraHeaders,
          Authorization: "Bearer " + adminApiKeyValue
        };
      }
      return {
        ...extraHeaders,
        "x-admin-username": adminApiUsername,
        "x-admin-password": adminApiPassword
      };
    }

    async function apiFetch(path, options = {}) {
      const { headers: optHeaders = {}, ...rest } = options;
      const method = String(rest.method || "GET").toUpperCase();
      const merged = { ...(optHeaders || {}) };
      if (!["GET", "HEAD", "DELETE"].includes(method) && merged["Content-Type"] === undefined) {
        merged["Content-Type"] = "application/json";
      }
      const response = await fetch(apiBase + path, {
        credentials: "include",
        headers: getAdminAuthHeaders(merged),
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
        const img = product.imageUrl ? '<img src="' + product.imageUrl + '" style="width:100%;height:200px;object-fit:cover;border-radius:0.5rem;margin-bottom:0.5rem;" />' : '';
        const escapedName = product.name.replace(/'/g, "\\'");
        return '<article class="item">' + img + '<h3>' + product.name + '</h3><div class="muted">' + product.category + '</div><div>Price: <strong>$' + Number(product.price).toFixed(2) + '</strong></div><div>Stock: <strong>' + product.stock + '</strong></div><div class="muted">' + product.description + '</div><div class="actions" style="margin-top:0.5rem;"><button class="secondary" style="padding:0.5rem 0.75rem;font-size:0.9rem;" onclick="populateEditForm(' + "'" + product.id + "'" + ', ' + "'" + escapedName + "'" + ')">Edit</button><button class="secondary product-delete-btn" data-product-id="' + product.id + '" type="button" style="padding:0.5rem 0.75rem;font-size:0.9rem;">Delete</button></div></article>';
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
          '<div>Items: ' + quotation.lines.map((line) => line.name + ' x' + line.quantity).join(', ') + '</div>' +
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

    function renderTransit(orders) {
      const transitOrders = orders.filter((order) => {
        const status = String(order.status || "");
        return status !== "DELIVERED" && status !== "CANCELLED";
      });

      document.getElementById("transitCount").textContent = String(transitOrders.length);
      if (!transitOrders.length) {
        document.getElementById("transitList").innerHTML = '<div class="muted">No goods currently in transit.</div>';
        return;
      }

      document.getElementById("transitList").innerHTML = transitOrders.map((order) => {
        const tracking = order.tracking || {};
        const coordinates = tracking.coordinates || {};
        const lat = Number(coordinates.lat);
        const lng = Number(coordinates.lng);
        const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
        const mapsUrl = hasCoordinates ? ("https://www.google.com/maps?q=" + lat + "," + lng) : "";
        return '<article class="item">' +
          '<div class="split"><h3>' + order.customerName + '</h3><span class="chip">' + order.status + '</span></div>' +
          '<div class="muted">Order ID: ' + order.id + '</div>' +
          '<div>Stage: <strong>' + (tracking.stage || "N/A") + '</strong></div>' +
          '<div>Current location: <strong>' + (tracking.currentLocation || "N/A") + '</strong></div>' +
          '<div>Coordinates: <strong>' + (hasCoordinates ? (lat.toFixed(5) + ", " + lng.toFixed(5)) : "N/A") + '</strong></div>' +
          '<div>Last update: <strong>' + (tracking.updatedAt ? new Date(tracking.updatedAt).toLocaleString() : "N/A") + '</strong></div>' +
          (hasCoordinates ? ('<div style="margin-top:0.5rem;"><a class="primary" target="_blank" rel="noopener noreferrer" href="' + mapsUrl + '">Open live map</a></div>') : "") +
        '</article>';
      }).join("");
    }

    async function loadDashboard() {
      try {
        const [productsResult, quotationsResult, ordersResult] = await Promise.allSettled([
          fetch(apiBase + "/api/products", { credentials: "include" }).then((res) => res.json()),
          apiFetch("/api/admin/quotations"),
          apiFetch("/api/admin/orders")
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

        allProducts = products;
        allQuotations = quotations;
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
        const response = await fetch(apiBase + "/api/admin/products", {
          method: "POST",
          credentials: "include",
          headers: getAdminAuthHeaders(),
          body: formData
        });

        if (response.ok) {
          productForm.reset();
          await loadDashboard();
          showStatus("Product saved successfully.");
        } else {
          showStatus("Could not save product. Please check the values and try again.");
        }
      } catch {
        showStatus("Could not save product. Please check the values and try again.");
      }
    });

    editProductForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(editProductForm);
      const productId = String(formData.get("productId"));
      
      if (!productId) {
        showStatus("Please enter a product ID.");
        return;
      }

      try {
        const response = await fetch(apiBase + "/api/admin/products/" + encodeURIComponent(productId), {
          method: "PATCH",
          credentials: "include",
          headers: getAdminAuthHeaders(),
          body: formData
        });

        if (response.ok) {
          editProductForm.reset();
          await loadDashboard();
          showStatus("Product updated successfully.");
        } else {
          showStatus("Could not update product. Please check the product ID and try again.");
        }
      } catch {
        showStatus("Could not update product. Please try again.");
      }
    });

    statusForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(statusForm);
      const orderId = String(formData.get("orderId"));
      const payload = {
        status: String(formData.get("status")),
        stage: String(formData.get("stage") || ""),
        currentLocation: String(formData.get("currentLocation") || "")
      };

      try {
        await apiFetch("/api/admin/orders/" + encodeURIComponent(orderId) + "/status", {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        statusForm.reset();
        await loadDashboard();
        showStatus("Order status updated successfully.");
      } catch {
        showStatus("Could not update that order. Check the order ID and try again.");
      }
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
        showStatus("Quotation updated: delivery estimate and discount applied.");
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
      const button = target.closest(".product-delete-btn");
      if (!(button instanceof HTMLElement)) {
        return;
      }

      const productId = button.getAttribute("data-product-id");
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
        showStatus("Product deleted successfully.");
      } catch (error) {
        showStatus("Could not delete product. " + (error && error.message ? error.message : "Please try again."));
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
        const response = await fetch(apiBase + "/api/admin/credentials", {
          method: "POST",
          credentials: "include",
          headers: getAdminAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            newUsername: String(formData.get("newUsername")),
            newPassword: newPassword
          })
        });

        if (response.ok) {
          credentialsForm.reset();
          showStatus("Credentials updated successfully. Please log in again.");
          setTimeout(() => window.location.href = "/logout", 1500);
        } else {
          showStatus("Failed to update credentials.");
        }
      } catch {
        showStatus("Could not update credentials. Please try again.");
      }
    });

    loadDashboard();
  </script>
</body>
</html>`;
}

app.get("/", (req, res) => {
  if (!isAuthenticated(req.headers.cookie)) {
    res.status(401).type("html").send(renderLoginPage());
    return;
  }

  res.type("html").send(renderAdminPage());
});

app.post("/login", (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  const expected = getAdminCreds();
  if (username !== expected.username || password !== expected.password) {
    res.status(401).type("html").send(renderLoginPage("Invalid username or password."));
    return;
  }

  const token = createSessionToken(username!);
  res.setHeader("Set-Cookie", `${sessionCookieName}=${token}; HttpOnly; Path=/; SameSite=Lax`);
  res.redirect("/");
});

app.post("/logout", (req, res) => {
  res.setHeader("Set-Cookie", `${sessionCookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
  res.redirect("/");
});

const port = Number(process.env.PORT ?? 3200);
app.listen(port, () => {
  console.log(`Admin app running on http://localhost:${port}`);
});
