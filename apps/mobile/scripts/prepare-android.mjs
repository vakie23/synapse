import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.join(mobileRoot, "../..");

const appUrl =
  process.env.APP_URL?.trim() || "https://synapse-web-k718.onrender.com";
const apiUrl =
  process.env.API_URL?.trim() || "https://synapse-api-k718.onrender.com";

if (!appUrl.startsWith("https://")) {
  console.error("APP_URL must be a public HTTPS URL for Google Play (not localhost).");
  process.exit(1);
}

console.log("Building customer app server (@hardware/web)...");
execSync("npm run build -w @hardware/web", {
  cwd: repoRoot,
  stdio: "inherit"
});

console.log("\nPreparing Synapse Engineering Android app");
console.log("  App URL :", appUrl);
console.log("  API URL :", apiUrl);

execSync("npx cap sync android", {
  cwd: mobileRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    APP_URL: appUrl,
    API_URL: apiUrl
  }
});

console.log("\nAndroid app ready for Google Play.");
console.log("Next steps:");
console.log("  npm run app:open     — open Android Studio");
console.log("  npm run app:bundle   — build signed AAB (needs keystore.properties)");
