import express from "express";

const app = express();
app.use("/assets", express.static("C:\\Users\\ProBook\\Downloads"));

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Synapse Engineering</title>
  <style>
    :root {
      --brand-blue: #241c7a;
      --brand-red: #b32025;
      --brand-gold: #f0bb2d;
      --ink: #171717;
      --soft: #f4f5fb;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: var(--ink); background: white; line-height: 1.5; }
    header, main, footer { width: min(1100px, 92vw); margin: 0 auto; }
    .hero { padding: 3rem 0 2rem 7.25rem; }
    .top-left-logo { position: fixed; top: 0.9rem; left: 0.9rem; z-index: 10; }
    .top-left-logo img { width: 90px; height: auto; display: block; }
    .brand { color: var(--brand-blue); font-size: 2.7rem; margin-bottom: 0.3rem; }
    .tag { color: var(--brand-red); font-size: 1.2rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .intro { max-width: 760px; font-size: 1.05rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 1rem; margin: 1.5rem 0; }
    .button { display: inline-block; padding: 0.9rem 1.2rem; border-radius: 0.6rem; text-decoration: none; font-weight: 700; }
    .button-primary { background: var(--brand-blue); color: white; }
    .button-secondary { background: var(--brand-red); color: white; }
    .button-light { background: var(--soft); color: var(--brand-blue); border: 1px solid #d8dbf0; }
    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin: 2rem 0; }
    .card { background: var(--soft); padding: 1.2rem; border-radius: 0.8rem; border: 1px solid #e4e6f5; }
    .card h3 { margin-top: 0; color: var(--brand-blue); }
    .section-title { color: var(--brand-blue); margin-top: 2rem; }
    .contact { background: #fff7ef; border-left: 6px solid var(--brand-gold); padding: 1rem 1.2rem; border-radius: 0.5rem; margin: 2rem 0; }
    footer { padding: 2rem 0 3rem; color: #4b4b4b; }
  </style>
</head>
<body>
  <a class="top-left-logo" href="/" aria-label="Synapse Engineering home">
    <img src="/assets/WhatsApp%20Image%202026-04-22%20at%201.42.08%20PM.jpeg" alt="Synapse Engineering logo" />
  </a>
  <header class="hero">
    <h1 class="brand">Synapse Engineering</h1>
    <p class="intro">
      We supply electrical equipment online, prepare quotations for customers, arrange delivery,
      and support electrical engineering services ranging from installation to consulting.
    </p>
    <div class="actions">
      <a class="button button-primary" href="/quotation">View items and get a quotation</a>
      <a class="button button-secondary" href="/track">Track your order</a>
      <a class="button button-light" href="mailto:info@synapseengineering.co.zw">Email us</a>
    </div>
  </header>
  <main>
    <section aria-labelledby="services-title">
      <h2 id="services-title" class="section-title">Our Services</h2>
      <div class="grid">
        <article class="card"><h3>Power Line Construction</h3><p>Utility and infrastructure support for modern power networks.</p></article>
        <article class="card"><h3>Solar Construction</h3><p>Heavy solar system supply and installation for homes and commercial sites.</p></article>
        <article class="card"><h3>Domestic and Industrial Installations</h3><p>Reliable installation services for buildings, factories, and facilities.</p></article>
        <article class="card"><h3>Electrical Consulting</h3><p>Designing, auditing, maintenance, and backup power solutions.</p></article>
      </div>
    </section>
    <section aria-labelledby="delivery-title">
      <h2 id="delivery-title" class="section-title">Online Ordering and Delivery</h2>
      <div class="grid">
        <article class="card"><h3>Buy online</h3><p>Customers browse electrical items, check prices, and request quotations.</p></article>
        <article class="card"><h3>Delivery location support</h3><p>Orders capture customer address and GPS coordinates for delivery planning.</p></article>
        <article class="card"><h3>Goods in transit tracking</h3><p>The API exposes tracking details so customers can see where goods are.</p></article>
      </div>
    </section>
    <section class="contact" aria-labelledby="contact-title">
      <h2 id="contact-title">Contact Synapse Engineering</h2>
      <p>Email: <a href="mailto:info@synapseengineering.co.zw">info@synapseengineering.co.zw</a></p>
      <p>Phone: <a href="tel:+263771234567">+263 77 123 4567</a></p>
    </section>
  </main>
</body>
</html>`);
});

app.get("/quotation", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Quotation | Synapse Engineering</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #f7f8fc; color: #1a1a1a; }
    main { width: min(1100px, 94vw); margin: 0 auto; padding: 2rem 0 3rem; }
    h1, h2 { color: #241c7a; }
    .topbar { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; }
    .panel { background: white; border-radius: 0.8rem; padding: 1rem; box-shadow: 0 8px 30px rgba(0,0,0,0.06); margin-top: 1rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border-bottom: 1px solid #e8e8ee; text-align: left; padding: 0.8rem 0.5rem; vertical-align: top; }
    th { color: #241c7a; }
    .note { background: #fff7ef; padding: 1rem; border-left: 5px solid #f0bb2d; border-radius: 0.4rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem; }
    .button { display: inline-block; padding: 0.85rem 1rem; border-radius: 0.5rem; text-decoration: none; font-weight: 700; }
    .primary { background: #241c7a; color: white; }
    .secondary { background: #b32025; color: white; }
    .layout { display: grid; grid-template-columns: 1.6fr 1fr; gap: 1rem; }
    .item-list { display: grid; gap: 0.8rem; }
    .item-card { display: grid; grid-template-columns: auto 1fr auto; gap: 0.8rem; align-items: start; padding: 0.9rem; border: 1px solid #e8e8ee; border-radius: 0.7rem; }
    .item-card h3 { margin: 0 0 0.25rem; color: #241c7a; font-size: 1rem; }
    .item-card p { margin: 0.1rem 0; }
    .qty-input, input, textarea, select { width: 100%; padding: 0.7rem; border: 1px solid #cfd4ea; border-radius: 0.5rem; font: inherit; }
    label { display: block; font-weight: 700; margin-bottom: 0.35rem; }
    .field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .summary-row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.45rem 0; border-bottom: 1px solid #ececf2; }
    .total-row { font-size: 1.1rem; font-weight: 700; color: #241c7a; }
    .small { color: #666; font-size: 0.92rem; }
    .status { margin-top: 1rem; padding: 0.85rem; border-radius: 0.6rem; background: #eef3ff; color: #241c7a; }
    @media (max-width: 860px) {
      .layout, .field-grid { grid-template-columns: 1fr; }
      .item-card { grid-template-columns: auto 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <div class="topbar">
      <div>
        <h1>Items, Prices and Customer Quotation</h1>
        <p>Customers can review electrical products, request a quotation, and then proceed to delivery.</p>
      </div>
      <div>
        <a href="/track" class="button secondary">Track your order</a>
        <a href="/" class="button primary">Back to home page</a>
      </div>
    </div>

    <div class="layout">
      <section class="panel" aria-labelledby="items-title">
        <h2 id="items-title">Choose Items and Quantities</h2>
        <p>Select as many different electrical items as you want, enter quantity for each one, and the system will calculate the total quotation.</p>
        <div id="item-list" class="item-list" aria-live="polite"></div>
      </section>

      <section class="panel" aria-labelledby="quote-title">
        <h2 id="quote-title">Customer Details and Total</h2>
        <form id="quotation-form">
          <div class="field-grid">
            <div>
              <label for="customerName">Full name</label>
              <input id="customerName" name="customerName" required />
            </div>
            <div>
              <label for="phone">Phone number</label>
              <input id="phone" name="phone" required />
            </div>
            <div>
              <label for="email">Email address</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div>
              <label for="requiredDate">Date required</label>
              <input id="requiredDate" name="requiredDate" type="date" required />
            </div>
            <div>
              <label for="city">Town or city</label>
              <input id="city" name="city" required />
            </div>
            <div>
              <label for="region">Delivery region</label>
              <select id="region" name="region">
                <option value="A">Region A</option>
                <option value="B">Region B</option>
                <option value="C">Region C</option>
              </select>
            </div>
          </div>
          <div style="margin-top: 1rem;">
            <label for="physicalAddress">Physical address</label>
            <textarea id="physicalAddress" name="physicalAddress" rows="3" required></textarea>
          </div>
          <div class="note" style="margin-top: 1rem;">
            <div class="summary-row"><span>Selected items total</span><strong id="subtotal">$0.00</strong></div>
            <div class="summary-row"><span>Estimated delivery</span><strong id="deliveryFee">$4.00</strong></div>
            <div class="summary-row total-row"><span>Grand total</span><strong id="grandTotal">$4.00</strong></div>
            <p class="small">Customers can still contact Synapse Engineering directly after generating a quotation.</p>
          </div>
          <div class="actions">
            <button class="button primary" type="submit">Generate quotation</button>
            <a class="button secondary" href="tel:+263771234567">Direct phone call</a>
            <a class="button" href="mailto:info@synapseengineering.co.zw?subject=Quotation%20Request" style="background:#eceffd;color:#241c7a;">Email us</a>
          </div>
        </form>
        <div id="status" class="status" hidden></div>
      </section>
    </div>
  </main>
  <script>
    const itemList = document.getElementById("item-list");
    const subtotalEl = document.getElementById("subtotal");
    const deliveryFeeEl = document.getElementById("deliveryFee");
    const grandTotalEl = document.getElementById("grandTotal");
    const statusEl = document.getElementById("status");
    const form = document.getElementById("quotation-form");
    const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    let products = [];

    function getSelectedLines() {
      return products
        .map((product) => {
          const checkbox = document.getElementById("pick-" + product.id);
          const quantityInput = document.getElementById("qty-" + product.id);
          const quantity = Number(quantityInput.value || 0);
          if (!checkbox.checked || quantity <= 0) return null;
          return { productId: product.id, quantity };
        })
        .filter(Boolean);
    }

    async function updateTotals() {
      const lines = getSelectedLines();
      const region = document.getElementById("region").value;
      if (lines.length === 0) {
        subtotalEl.textContent = currency.format(0);
        deliveryFeeEl.textContent = currency.format(4);
        grandTotalEl.textContent = currency.format(4);
        return;
      }

      const totalWeightKg = lines.reduce((sum, line) => {
        const product = products.find((item) => item.id === line.productId);
        return sum + ((product?.weightKg || 0) * line.quantity);
      }, 0);

      const response = await fetch("http://localhost:4000/api/cart/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, delivery: { region, totalWeightKg, express: false } })
      });
      const data = await response.json();
      subtotalEl.textContent = currency.format(data.subtotal || 0);
      deliveryFeeEl.textContent = currency.format(data.deliveryFee || 0);
      grandTotalEl.textContent = currency.format(data.total || 0);
    }

    function renderProducts() {
      itemList.innerHTML = products.map((product) => \`
        <label class="item-card" for="pick-\${product.id}">
          <input id="pick-\${product.id}" type="checkbox" />
          <div>
            <h3>\${product.name}</h3>
            <p>\${product.category}</p>
            <p class="small">\${product.description}</p>
            <p><strong>\${currency.format(product.price)}</strong> per \${product.unit}</p>
          </div>
          <div>
            <label for="qty-\${product.id}">Quantity</label>
            <input class="qty-input" id="qty-\${product.id}" type="number" min="0" value="0" />
          </div>
        </label>
      \`).join("");

      itemList.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", updateTotals);
        input.addEventListener("change", updateTotals);
      });
    }

    async function loadProducts() {
      const response = await fetch("http://localhost:4000/api/products");
      products = await response.json();
      renderProducts();
      updateTotals();
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const lines = getSelectedLines();
      if (lines.length === 0) {
        statusEl.hidden = false;
        statusEl.textContent = "Please choose at least one item and enter a quantity.";
        return;
      }

      const region = document.getElementById("region").value;
      const city = document.getElementById("city").value;
      const totalWeightKg = lines.reduce((sum, line) => {
        const product = products.find((item) => item.id === line.productId);
        return sum + ((product?.weightKg || 0) * line.quantity);
      }, 0);

      const payload = {
        customerName: document.getElementById("customerName").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        city,
        physicalAddress: document.getElementById("physicalAddress").value,
        requiredDate: document.getElementById("requiredDate").value,
        lines,
        delivery: { region, totalWeightKg, express: false }
      };

      const response = await fetch("http://localhost:4000/api/quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        statusEl.hidden = false;
        statusEl.textContent = "Could not generate quotation. Please check all fields and try again.";
        return;
      }

      statusEl.hidden = false;
      statusEl.innerHTML = "<strong>Quotation created:</strong> " + data.quotationId +
        "<br><strong>Total:</strong> " + currency.format(data.total) +
        "<br><strong>Customer:</strong> " + data.customerName +
        "<br><strong>Phone:</strong> " + data.phone +
        "<br><strong>Email:</strong> " + data.email +
        "<br><strong>Date required:</strong> " + data.requiredDate +
        "<br><strong>Address:</strong> " + data.physicalAddress +
        "<br><br><a href='/track' class='button secondary'>Track your order</a>";
    });

    document.getElementById("region").addEventListener("change", updateTotals);
    loadProducts();
  </script>
</body>
</html>`);
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
    body { font-family: Arial, sans-serif; margin: 0; background: #f7f8fc; color: #1a1a1a; }
    main { width: min(1100px, 94vw); margin: 0 auto; padding: 2rem 0 3rem; }
    h1, h2 { color: #241c7a; }
    .panel { background: white; border-radius: 0.8rem; padding: 1.2rem; box-shadow: 0 8px 30px rgba(0,0,0,0.06); }
    .field-grid { display: grid; gap: 1rem; margin-top: 1rem; }
    label { display: block; font-weight: 700; margin-bottom: 0.35rem; }
    input { width: 100%; padding: 0.75rem; border: 1px solid #cfd4ea; border-radius: 0.5rem; font: inherit; }
    .button { display: inline-block; padding: 0.85rem 1rem; border-radius: 0.5rem; text-decoration: none; font-weight: 700; }
    .primary { background: #241c7a; color: white; border: 0; cursor: pointer; }
    .status { margin-top: 1rem; padding: 1rem; border-radius: 0.65rem; background: #eef3ff; color: #241c7a; }
    .error { margin-top: 1rem; padding: 1rem; border-radius: 0.65rem; background: #fff1f1; color: #b32025; }
    .tracker { margin-top: 1.5rem; display: grid; gap: 1rem; }
    #trackMap { width: 100%; height: 280px; border-radius: 0.65rem; margin-top: 1rem; background: #fafbff; display: flex; align-items: center; justify-content: center; color: #555; text-align: center; padding: 1rem; }
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
      <div id="trackMap" class="map-placeholder">Enter an order ID above to view its transit location on the map.</div>
      <a class="back" href="/">← Back to home</a>
    </section>
  </main>
  <script>
    const trackForm = document.getElementById("track-form");
    const trackResult = document.getElementById("trackResult");
    const trackError = document.getElementById("trackError");
    const trackMap = document.getElementById("trackMap");
    let map;
    let marker;

    trackForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      trackResult.hidden = true;
      trackError.hidden = true;
      const orderId = document.getElementById("orderId").value.trim();
      if (!orderId) {
        trackError.hidden = false;
        trackError.textContent = "Please enter your order ID.";
        return;
      }

      try {
        const response = await fetch('http://localhost:4000/api/orders/' + encodeURIComponent(orderId) + '/tracking');
        if (!response.ok) {
          const body = await response.text();
          trackError.hidden = false;
          trackError.textContent = body || "Order not found. Please verify your order ID.";
          return;
        }

        const data = await response.json();
        trackResult.hidden = false;
        trackResult.innerHTML =
          '<div class="tracker">' +
            '<div class="track-row"><span>Current stage</span><span>' + data.tracking.stage + '</span></div>' +
            '<div class="track-row"><span>Current location</span><span>' + data.tracking.currentLocation + '</span></div>' +
            '<div class="track-row"><span>Coordinates</span><span>' + data.tracking.coordinates.lat.toFixed(4) + ', ' + data.tracking.coordinates.lng.toFixed(4) + '</span></div>' +
            '<div class="track-row"><span>Last updated</span><span>' + new Date(data.tracking.updatedAt).toLocaleString() + '</span></div>' +
          '</div>' +
          '<p style="margin-top:1rem;">If you need more details, contact us at <a href="mailto:info@synapseengineering.co.zw">info@synapseengineering.co.zw</a> or <a href="tel:+263771234567">+263 77 123 4567</a>.</p>';

        if (!map) {
          trackMap.innerHTML = '';
          map = L.map('trackMap').setView([data.tracking.coordinates.lat, data.tracking.coordinates.lng], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          marker = L.marker([data.tracking.coordinates.lat, data.tracking.coordinates.lng]).addTo(map)
            .bindPopup(data.tracking.currentLocation || 'Current shipment location')
            .openPopup();
        } else {
          map.setView([data.tracking.coordinates.lat, data.tracking.coordinates.lng], 13);
          marker.setLatLng([data.tracking.coordinates.lat, data.tracking.coordinates.lng]).bindPopup(data.tracking.currentLocation || 'Current shipment location').openPopup();
        }
        trackMap.style.background = 'transparent';
      } catch (error) {
        trackError.hidden = false;
        trackError.textContent = "Unable to reach the tracking service. Please try again later.";
      }
    });
  </script>
</body>
</html>`);
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Web app running on http://localhost:${port}`);
});
