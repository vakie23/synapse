import type { CapacitorConfig } from "@capacitor/cli";

const appUrl = process.env.APP_URL ?? "https://example.com";

const config: CapacitorConfig = {
  appId: "com.synapseengineering.hardwaresupplies",
  appName: "Synapse Engineering",
  webDir: "www",
  server: {
    url: appUrl,
    cleartext: false
  }
};

export default config;
