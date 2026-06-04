import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const mobileRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.join(mobileRoot, "../..");
const keystoreProps = path.join(mobileRoot, "android", "keystore.properties");

console.log("=== Synapse Engineering — Google Play release build ===\n");

execSync("npm run build", { cwd: repoRoot, stdio: "inherit" });
execSync("node scripts/prepare-android.mjs", {
  cwd: mobileRoot,
  stdio: "inherit",
  env: process.env
});

if (!fs.existsSync(keystoreProps)) {
  console.warn("\nWarning: android/keystore.properties not found.");
  console.warn("Create it from keystore.properties.example before bundleRelease.");
  console.warn("Or build a signed AAB in Android Studio: Build → Generate Signed Bundle.\n");
  process.exit(0);
}

console.log("\nBuilding release AAB...");
execSync("gradlew.bat bundleRelease", {
  cwd: path.join(mobileRoot, "android"),
  stdio: "inherit",
  shell: true
});

console.log("\nRelease AAB output:");
console.log("  apps/mobile/android/app/build/outputs/bundle/release/app-release.aab");
console.log("Upload this file to Google Play Console.");
