export function renderCheckoutPage(apiBase: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Checkout | Synapse Engineering</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: linear-gradient(135deg, #f5f8ff, #fff8ef); color: #1a1a1a; }
    main { width: min(1100px, 94vw); margin: 0 auto; padding: 2rem 0 3rem; }
    h1, h2 { color: #241c7a; }
    .back-link {
      position: fixed; top: 0.85rem; left: 0.85rem; z-index: 300;
      display: grid; place-items: center; width: 2.75rem; height: 2.75rem;
      border-radius: 0.55rem; border: 1px solid #d8dbf0;
      background: rgba(255, 255, 255, 0.96); box-shadow: 0 8px 24px rgba(36, 28, 122, 0.18);
      color: #241c7a; text-decoration: none; font-size: 1.4rem; font-weight: 700; line-height: 1;
    }
    .topbar { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
    .panel { background: linear-gradient(135deg, #ffffff, #f7f9ff); border-radius: 0.8rem; padding: 1rem; box-shadow: 0 10px 30px rgba(36,28,122,0.10); margin-top: 1rem; }
    .layout { display: grid; grid-template-columns: 1.6fr 1fr; gap: 1rem; }
    .item-list { display: grid; gap: 1.25rem; }
    .category-group { border: 1px solid #e4e6f5; border-radius: 0.75rem; background: #fff; overflow: hidden; box-shadow: 0 4px 14px rgba(36,28,122,0.06); }
    .category-heading { margin: 0; padding: 0.75rem 1rem; font-size: 0.95rem; color: #241c7a; background: linear-gradient(135deg, #eef3ff, #f7f9ff); border-bottom: 3px solid #f0bb2d; }
    .category-items { display: grid; gap: 0.75rem; padding: 0.85rem; }
    .search-row { display: flex; gap: 0.6rem; flex-wrap: wrap; margin: 0.7rem 0 0.9rem; }
    .search-row input { flex: 1 1 240px; }
    .search-row button { border: 0; cursor: pointer; }
    .item-card { display: grid; grid-template-columns: auto 1fr auto; gap: 0.8rem; align-items: start; padding: 0.9rem; border: 1px solid #e8e8ee; border-radius: 0.7rem; background: linear-gradient(135deg, #ffffff, #eef3ff); }
    .item-card h3 { margin: 0 0 0.25rem; color: #241c7a; font-size: 1rem; }
    .item-card p { margin: 0.1rem 0; }
    .qty-input, input, textarea, select { width: 100%; padding: 0.7rem; border: 1px solid #cfd4ea; border-radius: 0.5rem; font: inherit; }
    label { display: block; font-weight: 700; margin-bottom: 0.35rem; }
    .field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .summary-row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.45rem 0; border-bottom: 1px solid #ececf2; }
    .total-row { font-size: 1.1rem; font-weight: 700; color: #241c7a; }
    .small { color: #666; font-size: 0.92rem; }
    .note { background: #fff7ef; padding: 1rem; border-left: 5px solid #f0bb2d; border-radius: 0.4rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem; }
    .button { display: inline-block; padding: 0.85rem 1rem; border-radius: 0.5rem; text-decoration: none; font-weight: 700; box-shadow: 0 8px 16px rgba(0,0,0,0.08); border: 0; cursor: pointer; }
    .primary { background: linear-gradient(135deg, #2f2ab2, #241c7a); color: white; }
    .secondary { background: linear-gradient(135deg, #d53d42, #b32025); color: white; }
    .status { margin-top: 1rem; padding: 0.85rem; border-radius: 0.6rem; background: linear-gradient(135deg, #eef3ff, #f5ecff); color: #241c7a; }
    .status[role="alert"] { background: linear-gradient(135deg, #fff1f1, #ffe7e7); color: #b32025; }
    #pickupMap { width: 100%; height: 250px; border-radius: 0.65rem; margin-top: 0.5rem; background: #fafbff; }
    @media (max-width: 860px) { .layout, .field-grid { grid-template-columns: 1fr; } .item-card { grid-template-columns: auto 1fr; } }
  </style>
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
</head>
<body>
  <a href="/" class="back-link" aria-label="Back to home">&larr;</a>
  <main>
    <div class="topbar">
      <h1>Checkout</h1>
      <a href="/quotation" class="button secondary">Request quotation instead</a>
    </div>
    <div class="layout">
      <section class="panel">
        <div class="search-row">
          <input id="itemSearch" type="search" placeholder="Search items by name, category, or description" />
          <button id="itemSearchBtn" class="button primary" type="button">Search</button>
        </div>
        <div id="item-list" class="item-list" aria-live="polite"></div>
      </section>
      <section class="panel" aria-labelledby="checkout-title">
        <h2 id="checkout-title">Delivery and payment</h2>
        <form id="checkout-form">
          <div class="field-grid">
            <div>
              <label for="customerName">Full name</label>
              <input id="customerName" name="customerName" required autocomplete="name" />
            </div>
            <div>
              <label for="phone">Phone number</label>
              <input id="phone" name="phone" required autocomplete="tel" />
            </div>
            <div>
              <label for="city">Town or city</label>
              <input id="city" name="city" required autocomplete="address-level2" />
            </div>
            <div>
              <label for="region">Delivery region</label>
              <select id="region" name="region">
                <option value="Harare">Harare</option>
                <option value="Bulawayo">Bulawayo</option>
                <option value="Manicaland">Manicaland</option>
                <option value="Mashonaland Central">Mashonaland Central</option>
                <option value="Mashonaland East">Mashonaland East</option>
                <option value="Mashonaland West">Mashonaland West</option>
                <option value="Masvingo">Masvingo</option>
                <option value="Matabeleland North">Matabeleland North</option>
                <option value="Matabeleland South">Matabeleland South</option>
                <option value="Midlands">Midlands</option>
              </select>
            </div>
            <div style="grid-column: 1 / -1;">
              <label for="address">Delivery address</label>
              <textarea id="address" name="address" rows="3" required autocomplete="street-address"></textarea>
            </div>
            <div style="grid-column: 1 / -1;">
              <label for="paymentMethod">Payment method</label>
              <select id="paymentMethod" name="paymentMethod" required>
                <option value="CASH_ON_DELIVERY">Cash on delivery</option>
                <option value="MOBILE_MONEY">Mobile money</option>
                <option value="CARD">Card</option>
              </select>
            </div>
          </div>
          <div style="margin-top: 1rem;">
            <label>Delivery location on map</label>
            <div class="actions" style="margin-top: 0.4rem;">
              <button id="detectLocationBtn" type="button" class="button" style="background:#eceffd;color:#241c7a;">Use my current location</button>
            </div>
            <p id="locationStatus" class="small" style="margin-top: 0.5rem;"></p>
            <div id="pickupMap"></div>
            <div class="field-grid" style="margin-top: 0.7rem;">
              <div>
                <label for="customerLat">Latitude</label>
                <input id="customerLat" name="customerLat" type="number" step="0.000001" readonly required />
              </div>
              <div>
                <label for="customerLng">Longitude</label>
                <input id="customerLng" name="customerLng" type="number" step="0.000001" readonly required />
              </div>
            </div>
          </div>
          <div class="note" style="margin-top: 1rem;">
            <div class="summary-row"><span>Items subtotal</span><strong id="subtotal">$0.00</strong></div>
            <div class="summary-row"><span>Estimated delivery</span><strong id="deliveryFee">$4.00</strong></div>
            <div class="summary-row total-row"><span>Order total</span><strong id="grandTotal">$4.00</strong></div>
          </div>
          <div class="actions">
            <button class="button primary" type="submit">Place order</button>
            <a class="button" href="/track" style="background:#eceffd;color:#241c7a;">Track existing order</a>
          </div>
        </form>
        <div id="status" class="status" hidden role="status" aria-live="polite"></div>
      </section>
    </div>
  </main>
  <script>
    const apiBase = ${JSON.stringify(apiBase)};

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    const itemList = document.getElementById("item-list");
    const subtotalEl = document.getElementById("subtotal");
    const deliveryFeeEl = document.getElementById("deliveryFee");
    const grandTotalEl = document.getElementById("grandTotal");
    const statusEl = document.getElementById("status");
    const itemSearchInput = document.getElementById("itemSearch");
    const itemSearchBtn = document.getElementById("itemSearchBtn");
    const locationStatusEl = document.getElementById("locationStatus");
    const detectLocationBtn = document.getElementById("detectLocationBtn");
    const form = document.getElementById("checkout-form");
    const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    const regionBaseFees = {
      "Harare": 4, "Bulawayo": 7, "Manicaland": 8, "Mashonaland Central": 7.5,
      "Mashonaland East": 6.5, "Mashonaland West": 7, "Masvingo": 8.5,
      "Matabeleland North": 9, "Matabeleland South": 9, "Midlands": 8
    };
    let products = [];
    let pickupMap;
    let pickupMarker;

    function setCustomerLocation(lat, lng) {
      document.getElementById("customerLat").value = String(Number(lat).toFixed(6));
      document.getElementById("customerLng").value = String(Number(lng).toFixed(6));
    }

    function initPickupMap() {
      const defaultLat = -17.8252;
      const defaultLng = 31.0335;
      pickupMap = L.map("pickupMap").setView([defaultLat, defaultLng], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(pickupMap);
      pickupMarker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(pickupMap);
      setCustomerLocation(defaultLat, defaultLng);
      pickupMap.on("click", (event) => {
        pickupMarker.setLatLng([event.latlng.lat, event.latlng.lng]);
        setCustomerLocation(event.latlng.lat, event.latlng.lng);
      });
      pickupMarker.on("dragend", () => {
        const position = pickupMarker.getLatLng();
        setCustomerLocation(position.lat, position.lng);
      });
    }

    function detectCurrentLocation() {
      if (!navigator.geolocation) {
        locationStatusEl.textContent = "Geolocation is not supported on this browser.";
        return;
      }
      locationStatusEl.textContent = "";
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          pickupMarker.setLatLng([lat, lng]);
          pickupMap.setView([lat, lng], 14);
          setCustomerLocation(lat, lng);
        },
        () => {
          locationStatusEl.textContent = "Could not access your location. Select a point on the map instead.";
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    function getSelectedLines() {
      return products.map((product) => {
        const checkbox = document.getElementById("pick-" + product.id);
        const quantityInput = document.getElementById("qty-" + product.id);
        const quantity = Number(quantityInput.value || 0);
        if (!checkbox.checked || quantity <= 0) return null;
        return { productId: product.id, quantity };
      }).filter(Boolean);
    }

    async function updateTotals() {
      const lines = getSelectedLines();
      const region = document.getElementById("region").value;
      if (lines.length === 0) {
        const baseFee = regionBaseFees[region] ?? 4;
        subtotalEl.textContent = currency.format(0);
        deliveryFeeEl.textContent = currency.format(baseFee);
        grandTotalEl.textContent = currency.format(baseFee);
        return;
      }
      const totalWeightKg = lines.reduce((sum, line) => {
        const product = products.find((item) => item.id === line.productId);
        return sum + ((product?.weightKg || 0) * line.quantity);
      }, 0);
      const response = await fetch(apiBase + "/api/cart/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, delivery: { region, totalWeightKg, express: false } })
      });
      const data = await response.json();
      subtotalEl.textContent = currency.format(data.subtotal || 0);
      deliveryFeeEl.textContent = currency.format(data.deliveryFee || 0);
      grandTotalEl.textContent = currency.format(data.total || 0);
    }

    const categoryOrder = ["Conduits and fittings", "Boxes and panels", "Cables", "Sockets and switches", "Control units"];

    function productImageHtml(product) {
      if (!product.imageUrl) {
        return '<div style="width:100%;max-width:140px;height:100px;border-radius:0.5rem;background:#eef2ff;border:1px solid #dfe3f5;margin-bottom:0.45rem;"></div>';
      }
      const src = product.imageUrl.startsWith("http://") || product.imageUrl.startsWith("https://")
        ? product.imageUrl
        : apiBase + (product.imageUrl.startsWith("/") ? product.imageUrl : "/" + product.imageUrl);
      return '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(product.name) + '" style="width:100%;max-width:140px;height:100px;object-fit:cover;border-radius:0.5rem;border:1px solid #dfe3f5;margin-bottom:0.45rem;" />';
    }

    function renderProductCard(product) {
      return '<label class="item-card" for="pick-' + escapeHtml(product.id) + '">' +
        '<input id="pick-' + escapeHtml(product.id) + '" type="checkbox" />' +
        '<div>' + productImageHtml(product) +
        '<h3>' + escapeHtml(product.name) + '</h3>' +
        '<p class="small">' + escapeHtml(product.description) + '</p>' +
        '<p><strong>' + currency.format(product.price) + '</strong> per ' + escapeHtml(product.unit) + '</p>' +
        '</div>' +
        '<div><label for="qty-' + escapeHtml(product.id) + '">Quantity</label>' +
        '<input class="qty-input" id="qty-' + escapeHtml(product.id) + '" type="number" min="0" value="0" /></div>' +
        '</label>';
    }

    function renderProducts() {
      const byCategory = new Map();
      products.forEach((product) => {
        const category = product.category || "Other";
        if (!byCategory.has(category)) byCategory.set(category, []);
        byCategory.get(category).push(product);
      });
      const categories = [...byCategory.keys()].sort((a, b) => {
        const ai = categoryOrder.indexOf(a);
        const bi = categoryOrder.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
      itemList.innerHTML = categories.map((category) =>
        '<section class="category-group">' +
        '<h3 class="category-heading">' + escapeHtml(category) + '</h3>' +
        '<div class="category-items">' + byCategory.get(category).map(renderProductCard).join("") + '</div></section>'
      ).join("");
      itemList.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", updateTotals);
        input.addEventListener("change", updateTotals);
      });
    }

    async function loadProducts(searchQuery = "") {
      const query = String(searchQuery || "").trim();
      const path = query ? ("/api/products?search=" + encodeURIComponent(query)) : "/api/products";
      const response = await fetch(apiBase + path);
      products = await response.json();
      renderProducts();
      updateTotals();
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      statusEl.hidden = true;
      statusEl.removeAttribute("role");
      const lines = getSelectedLines();
      if (lines.length === 0) {
        statusEl.hidden = false;
        statusEl.setAttribute("role", "alert");
        statusEl.textContent = "Please choose at least one item and enter a quantity.";
        return;
      }

      const payload = {
        customerName: document.getElementById("customerName").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,
        city: document.getElementById("city").value,
        region: document.getElementById("region").value,
        paymentMethod: document.getElementById("paymentMethod").value,
        customerLocation: {
          lat: Number(document.getElementById("customerLat").value),
          lng: Number(document.getElementById("customerLng").value)
        },
        items: lines
      };

      try {
        const response = await fetch(apiBase + "/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
          statusEl.hidden = false;
          statusEl.setAttribute("role", "alert");
          statusEl.textContent = data.message || "Could not place order. Please check your details and try again.";
          return;
        }

        statusEl.hidden = false;
        statusEl.innerHTML =
          "<strong>Order confirmed:</strong> " + escapeHtml(data.id) +
          "<br><strong>Status:</strong> " + escapeHtml(data.status) +
          "<br><strong>Total:</strong> " + escapeHtml(currency.format(data.total)) +
          "<br><strong>Payment:</strong> " + escapeHtml(data.paymentMethod.replace(/_/g, " ")) +
          "<br><br><a href='/track' class='button primary'>Track this order</a>";
        form.reset();
        itemList.querySelectorAll("input[type=checkbox]").forEach((input) => { input.checked = false; });
        itemList.querySelectorAll(".qty-input").forEach((input) => { input.value = "0"; });
        updateTotals();
      } catch {
        statusEl.hidden = false;
        statusEl.setAttribute("role", "alert");
        statusEl.textContent = "Unable to reach the order service. Please try again later.";
      }
    });

    document.getElementById("region").addEventListener("change", updateTotals);
    itemSearchBtn.addEventListener("click", () => loadProducts(itemSearchInput.value));
    itemSearchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        loadProducts(itemSearchInput.value);
      }
    });
    detectLocationBtn.addEventListener("click", detectCurrentLocation);
    initPickupMap();
    loadProducts();
  </script>
</body>
</html>`;
}
