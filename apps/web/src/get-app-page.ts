import { mobileMetaHtml } from "./mobile-meta.js";

export function renderGetAppPage(playStoreUrl: string): string {
  const playStoreBlock = playStoreUrl
    ? `<a class="button primary" href="${playStoreUrl}" rel="noopener noreferrer">Get it on Google Play</a>`
    : `<p class="note">Google Play listing coming soon. Use the options below on your phone today.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${mobileMetaHtml}
  <link rel="manifest" href="/manifest.webmanifest" />
  <title>Get the app | Synapse Engineering</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: linear-gradient(135deg, #f5f8ff, #fff8ef); color: #1a1a1a; line-height: 1.65; }
    main { width: min(720px, 92vw); margin: 0 auto; padding: 2rem 0 3rem; }
    h1, h2 { color: #241c7a; }
    .panel { background: #fff; border-radius: 0.85rem; padding: 1.25rem; box-shadow: 0 10px 30px rgba(36,28,122,0.08); margin-top: 1rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.85rem; margin-top: 1rem; }
    .button { display: inline-block; padding: 0.85rem 1rem; border-radius: 0.5rem; text-decoration: none; font-weight: 700; }
    .primary { background: linear-gradient(135deg, #2f2ab2, #241c7a); color: white; }
    .secondary { background: linear-gradient(135deg, #d53d42, #b32025); color: white; }
    .muted { background: #eceffd; color: #241c7a; }
    .note { background: #fff7ef; border-left: 4px solid #f0bb2d; padding: 0.85rem 1rem; border-radius: 0.4rem; margin: 0; }
    ol { padding-left: 1.2rem; }
    li { margin-bottom: 0.5rem; }
    a { color: #241c7a; font-weight: 600; }
  </style>
</head>
<body>
  <main>
    <h1>Get the Synapse Engineering app</h1>
    <p>The mobile app uses the same shop, quotations, and order tracking as this website. You can use it in your browser now or install it on your phone.</p>

    <section class="panel">
      <h2>Use it in your browser (available now)</h2>
      <p>Open the shop on your phone — no download required:</p>
      <div class="actions">
        <a class="button primary" href="/shop">Open shop</a>
        <a class="button muted" href="/track">Track order</a>
      </div>
    </section>

    <section class="panel">
      <h2>Google Play (Android)</h2>
      ${playStoreBlock}
    </section>

    <section class="panel">
      <h2>Add to your home screen</h2>
      <p>This installs a shortcut that opens like an app:</p>
      <p><strong>Android (Chrome)</strong></p>
      <ol>
        <li>Open this site in Chrome.</li>
        <li>Tap the menu (⋮) → <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
        <li>Tap <strong>Add</strong> / <strong>Install</strong>.</li>
      </ol>
      <p><strong>iPhone (Safari)</strong></p>
      <ol>
        <li>Open this site in Safari.</li>
        <li>Tap Share → <strong>Add to Home Screen</strong>.</li>
      </ol>
    </section>

    <p><a href="/">← Back to home</a></p>
  </main>
</body>
</html>`;
}
