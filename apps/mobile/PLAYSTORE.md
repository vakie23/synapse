# Publish Synapse Engineering on Google Play

The **Synapse Engineering** Android app (`apps/mobile`) is a Capacitor shell that loads your deployed customer app over HTTPS.

Production app URL (set `APP_URL`):

`https://synapse-web-k718.onrender.com`

Your API must also stay online at `API_URL` (default: `https://synapse-api-k718.onrender.com`).

## What is already configured

- App ID: `com.synapseengineering.hardwaresupplies`
- App name: **Synapse Engineering**
- Min Android: API 24 (Android 7.0)
- Target SDK: 36 (Play Store requirement)
- Internet + location permissions (shop delivery map)
- Privacy: `https://synapse-web-k718.onrender.com/privacy`
- Terms: `https://synapse-web-k718.onrender.com/terms`
- Maps and CDN hosts allowed in WebView navigation

## Step 1 — Install tools

1. [Android Studio](https://developer.android.com/studio) (latest)
2. [Google Play Console](https://play.google.com/console) account ($25 one-time fee)

## Step 2 — Build and sync the Android app

From the **repository root** in PowerShell:

```powershell
cd C:\Users\User\OneDrive\Desktop\hardware-supplies-app\hardware-supplies-app
npm install
```

Set your live HTTPS URLs (required for Play Store — no localhost):

```powershell
$env:APP_URL="https://synapse-web-k718.onrender.com"
$env:API_URL="https://synapse-api-k718.onrender.com"
npm run app:prepare
```

`app:prepare` builds the customer app server and syncs Capacitor into the Android project.

## Step 3 — Open in Android Studio

```powershell
npm run app:open
```

Wait for Gradle sync to finish.

## Step 4 — Create a signing key (first time only)

1. Android Studio → **Build** → **Generate Signed App Bundle / APK**
2. Choose **Android App Bundle**
3. **Create new** keystore — save the `.jks` file and passwords securely
4. Or copy `android/keystore.properties.example` to `android/keystore.properties`

## Step 5 — Build release AAB

**Android Studio:** Build → Generate Signed Bundle / APK → AAB

**Command line** (after `keystore.properties` is set):

```powershell
npm run app:bundle
```

Or full pipeline from repo root:

```powershell
$env:APP_URL="https://synapse-web-k718.onrender.com"
$env:API_URL="https://synapse-api-k718.onrender.com"
npm run app:release
```

Output: `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`

## Step 6 — Play Console listing

| Item | Value |
|------|--------|
| App name | Synapse Engineering |
| Category | Shopping or Business |
| Privacy policy | https://synapse-web-k718.onrender.com/privacy |
| Contact email | synapseengineering@gmail.com |

### Data safety

- **Location** — optional, for delivery map on shop page
- **Personal info** — name, email, phone, address (quotations/orders)
- Data is **not sold**
- Used for **app functionality**

### Store graphics (you provide)

- App icon 512×512 PNG
- Feature graphic 1024×500
- Phone screenshots (at least 2)

Replace default launcher icons: **File** → **New** → **Image Asset** in Android Studio.

## Step 7 — Test before production

1. Upload AAB to **Internal testing**
2. Add your Gmail as tester
3. Test: home, shop, quotation, order, map location, track order

Then promote to **Production**.

## Updating the app

1. Deploy API + customer app changes to Render
2. Bump `versionCode` and `versionName` in `apps/mobile/android/app/build.gradle`
3. Run `npm run app:prepare` with production `APP_URL` / `API_URL`
4. Build new AAB and upload to Play Console

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank screen | Confirm `APP_URL` is HTTPS and loads in Chrome on the phone |
| Map fails | Allow location when prompted; check `allowNavigation` hosts in `capacitor.config.ts` |
| Products empty | API must be running; set `API_BASE_URL` on Render web service |
| Gradle fails | Open Android Studio and install missing SDK components |
