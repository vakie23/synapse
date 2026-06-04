# Publish Synapse Engineering to Google Play

This folder is a **Capacitor Android wrapper** around your live website. The Play Store app loads:

`https://synapse-web-k718.onrender.com`

So your website and API must stay online and on HTTPS before you publish.

## What is already configured

- App ID: `com.synapseengineering.hardwaresupplies`
- App name: **Synapse Engineering**
- Min Android: API 24 (Android 7.0)
- Target SDK: 36 (Play Store requirement)
- Internet + location permissions (for quotation map)
- Privacy policy page: `https://synapse-web-k718.onrender.com/privacy`
- Terms and conditions: `https://synapse-web-k718.onrender.com/terms`

## Step 1 — Install tools

1. [Android Studio](https://developer.android.com/studio) (latest)
2. [Google Play Console](https://play.google.com/console) account ($25 one-time fee)

## Step 2 — Sync the Android project

From the **repository root** in PowerShell:

```powershell
cd C:\Users\User\OneDrive\Desktop\hardware-supplies-app\hardware-supplies-app
npm install
npm run mobile:prepare
```

Optional: use a different web URL:

```powershell
$env:APP_URL="https://your-custom-domain.com"
npm run mobile:prepare
```

## Step 3 — Open in Android Studio

```powershell
npm run mobile:open
```

Wait for Gradle sync to finish.

## Step 4 — Create a signing key (first time only)

1. Android Studio → **Build** → **Generate Signed App Bundle / APK**
2. Choose **Android App Bundle**
3. **Create new** keystore — save the `.jks` file and passwords somewhere safe (you cannot recover a lost keystore)
4. Or copy `android/keystore.properties.example` to `android/keystore.properties` and point it at your keystore, then build from the command line

## Step 5 — Build release AAB

In Android Studio:

1. **Build** → **Generate Signed Bundle / APK**
2. **Android App Bundle (AAB)**
3. Select your release keystore
4. Output: `android/app/release/app-release.aab`

Command line (after `keystore.properties` is set):

```powershell
cd apps\mobile\android
.\gradlew.bat bundleRelease
```

## Step 6 — Play Console listing

Create a new app and upload the `.aab`.

| Item | Suggested value |
|------|-----------------|
| App name | Synapse Engineering |
| Category | Shopping or Business |
| Privacy policy URL | https://synapse-web-k718.onrender.com/privacy |
| Contact email | synapseengineering@gmail.com |

### Data safety (important)

Declare roughly:

- **Location** — optional, for delivery map on quotation page
- **Personal info** — name, email, phone, address (quotations/orders)
- Data is **not sold**
- Data is collected for **app functionality**

### Store graphics (you provide)

- App icon 512×512 PNG
- Feature graphic 1024×500
- Phone screenshots (at least 2)

Replace default launcher icons in Android Studio: **File** → **New** → **Image Asset**.

## Step 7 — Testing before production

1. Upload AAB to **Internal testing** track
2. Add your Gmail as a tester
3. Install from Play Store test link
4. Test: home, quotation, map location, track order

Then promote to **Production**.

## Updating the app later

1. Bump `versionCode` and `versionName` in `apps/mobile/android/app/build.gradle`
2. Deploy website/API changes to Render
3. Run `npm run mobile:prepare` and build a new AAB
4. Upload new AAB to Play Console

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank white screen | Check `APP_URL` is HTTPS and the site loads in Chrome on the phone |
| Map / location fails | Allow location permission when prompted; use HTTPS site |
| Gradle fails | Open Android Studio and let it install missing SDK components |
