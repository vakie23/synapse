import type { CapacitorConfig } from "@capacitor/cli";

const appUrl =
  process.env.APP_URL?.trim() || "https://synapse-web-k718.onrender.com";

const config: CapacitorConfig = {
  appId: "com.synapseengineering.hardwaresupplies",
  appName: "Synapse Engineering",
  webDir: "www",
  server: {
    url: appUrl,
    cleartext: false,
    androidScheme: "https"
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
