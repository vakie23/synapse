import { mobileMetaHtml } from "./mobile-meta.js";

const legalPageStyles = `
    body { font-family: Arial, sans-serif; margin: 0; background: #f7f9ff; color: #1a1a1a; line-height: 1.65; }
    main { width: min(760px, 92vw); margin: 0 auto; padding: 2rem 0 3rem; }
    h1, h2 { color: #241c7a; }
    a { color: #241c7a; font-weight: 600; }
    .legal-nav { margin-bottom: 1.5rem; font-size: 0.95rem; }
    ul { padding-left: 1.2rem; }
    li { margin-bottom: 0.35rem; }
`;

function legalPageShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${mobileMetaHtml}
  <title>${title} | Synapse Engineering</title>
  <style>${legalPageStyles}</style>
</head>
<body>
  <main>
    <p class="legal-nav"><a href="/">Home</a> &middot; <a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a></p>
    ${bodyHtml}
    <p style="margin-top:2rem;"><a href="/">Back to home</a></p>
  </main>
</body>
</html>`;
}

export function renderPrivacyPage(): string {
  return legalPageShell("Privacy Policy", `
    <h1>Privacy Policy</h1>
    <p><strong>Synapse Engineering</strong> (&quot;we&quot;, &quot;us&quot;) operates the Synapse Engineering website and mobile app for electrical hardware supplies, quotations, orders, and delivery tracking.</p>
    <p>Last updated: June 2026</p>
    <h2>Information we collect</h2>
    <ul>
      <li>Contact details you provide (name, phone, email, delivery address).</li>
      <li>Quotation and order details (products, quantities, prices, payment choice).</li>
      <li>Delivery location coordinates when you choose to use the map or GPS on the shop page.</li>
    </ul>
    <h2>How we use information</h2>
    <ul>
      <li>To prepare quotations and fulfil orders.</li>
      <li>To calculate delivery fees and show order tracking updates.</li>
      <li>To contact you about your request or order.</li>
    </ul>
    <h2>Location data</h2>
    <p>Location is used only when you tap &quot;Use my current location&quot; or set a point on the map for delivery. We do not track your location in the background.</p>
    <h2>Data sharing</h2>
    <p>We do not sell your personal data. We may share information only as needed to deliver your order or comply with law.</p>
    <h2>Data retention</h2>
    <p>We keep quotation and order records as long as needed for business and legal purposes.</p>
    <h2>Contact</h2>
    <p>Email: <a href="mailto:synapseengineering@gmail.com">synapseengineering@gmail.com</a><br>
    Phone: <a href="tel:+263783944171">+263 783 944 171</a></p>
  `);
}

export function renderTermsPage(): string {
  return legalPageShell("Terms and Conditions", `
    <h1>Terms and Conditions</h1>
    <p>These terms apply when you use the Synapse Engineering website or app to browse products, request quotations, or place orders. By using our services, you agree to these terms.</p>
    <p>Last updated: June 2026</p>
    <h2>About us</h2>
    <p><strong>Synapse Engineering</strong> supplies electrical hardware and related services in Zimbabwe. Contact: <a href="mailto:synapseengineering@gmail.com">synapseengineering@gmail.com</a>, <a href="tel:+263783944171">+263 783 944 171</a>.</p>
    <h2>Quotations and orders</h2>
    <ul>
      <li>A <strong>quotation</strong> is an estimate of price and availability. It is not a confirmed sale until we accept or confirm it with you.</li>
      <li>An <strong>order</strong> is a request to purchase selected items. We may confirm, amend, or decline an order depending on stock and payment.</li>
      <li>Prices, stock, and delivery fees shown online are subject to change. The total confirmed at checkout or in your quotation response is what applies to that transaction.</li>
    </ul>
    <h2>Payment</h2>
    <ul>
      <li>We may offer cash on delivery, mobile money, card, or other methods as shown on the shop page.</li>
      <li>For cash on delivery, payment is due when goods are delivered unless we agree otherwise in writing.</li>
      <li>For other payment methods, we will tell you when and how payment is required before dispatch.</li>
    </ul>
    <h2>Delivery</h2>
    <ul>
      <li>Delivery fees depend on region, weight, and service options shown at checkout or on your quotation.</li>
      <li>You must provide an accurate delivery address and phone number. Delays caused by incorrect details or access problems are your responsibility.</li>
      <li>Estimated arrival times are indicative only and are not guaranteed.</li>
    </ul>
    <h2>Returns and defects</h2>
    <p>If goods are faulty or not as agreed, contact us promptly. We will work with you to replace, repair, or refund where appropriate under applicable consumer law and our internal policies.</p>
    <h2>Cancellations</h2>
    <p>You may request cancellation before goods are dispatched. After dispatch, cancellation may not be possible and return rules above apply.</p>
    <h2>Your responsibilities</h2>
    <ul>
      <li>Provide accurate contact and delivery information.</li>
      <li>Use the site lawfully and do not misuse our systems or staff accounts.</li>
      <li>Ensure electrical products are installed and used by qualified persons where required by law or safety standards.</li>
    </ul>
    <h2>Limitation of liability</h2>
    <p>To the extent permitted by law, we are not liable for indirect or consequential loss. Our liability for any claim relating to a specific order is limited to the amount paid for that order, except where law requires otherwise.</p>
    <h2>Privacy</h2>
    <p>Our <a href="/privacy">Privacy Policy</a> explains how we handle your personal data.</p>
    <h2>Changes</h2>
    <p>We may update these terms from time to time. Continued use of the site after changes means you accept the updated terms.</p>
    <h2>Governing law</h2>
    <p>These terms are governed by the laws of Zimbabwe. Disputes should first be raised with us in good faith using the contact details above.</p>
    <p><em>This page is a general business template and does not replace professional legal advice.</em></p>
  `);
}
