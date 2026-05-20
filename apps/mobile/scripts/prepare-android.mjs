import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const appUrl =
  process.env.APP_URL?.trim() || "https://synapse-web-k718.onrender.com";

console.log("Preparing Android app for:", appUrl);

execSync("npx cap sync android", {
  cwd: mobileRoot,
  stdio: "inherit",
  env: { ...process.env, APP_URL: appUrl }
});

console.log("\nAndroid project synced. Open Android Studio with: npm run android:open -w @hardware/mobile");
