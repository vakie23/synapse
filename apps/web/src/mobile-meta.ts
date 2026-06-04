/** Meta tags and styles for Capacitor / mobile WebView (Google Play app). */
export const mobileMetaHtml = `
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="theme-color" content="#241c7a" />
  <style>
    body { -webkit-tap-highlight-color: transparent; padding-bottom: env(safe-area-inset-bottom, 0); }
  </style>
`;
