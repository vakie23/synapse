import type { CapacitorConfig } from "@capacitor/cli";

const appUrl =
  process.env.APP_URL?.trim() || "https://synapse-web-k718.onrender.com";
const apiUrl =
  process.env.API_URL?.trim() || "https://synapse-api-k718.onrender.com";

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

const appHost = hostname(appUrl);
const apiHost = hostname(apiUrl);

const config: CapacitorConfig = {
  appId: "com.synapseengineering.hardwaresupplies",
  appName: "Synapse Engineering",
  webDir: "www",
  server: {
    url: appUrl,
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      appHost,
      apiHost,
      "unpkg.com",
      "tile.openstreetmap.org",
      "a.tile.openstreetmap.org",
      "b.tile.openstreetmap.org",
      "c.tile.openstreetmap.org"
    ].filter(Boolean)
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
