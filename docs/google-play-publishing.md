# Google Play Publishing Guide

The **Synapse Engineering** Android app lives in `apps/mobile` (Capacitor). It loads your deployed customer app over HTTPS — the same content as the website, optimized for mobile.

**Checklist:** `apps/mobile/PLAYSTORE.md`

## 1) Prerequisites

- Customer app and API deployed on HTTPS (Render or custom domain)
- Android Studio installed
- Google Play Console account
- Java/Android SDK configured

## 2) Configure production URLs

```powershell
$env:APP_URL="https://synapse-web-k718.onrender.com"
$env:API_URL="https://synapse-api-k718.onrender.com"
```

Copy `apps/mobile/.env.example` for reference.

## 3) Prepare the Android project

From repo root:

```powershell
npm install
npm run app:prepare
npm run app:open
```

## 4) Build signed release AAB

In Android Studio: **Build** → **Generate Signed Bundle / APK** → **Android App Bundle**

Or from repo root (with `android/keystore.properties`):

```powershell
npm run app:release
```

## 5) Play Console submission

Upload the `.aab` and complete:

- App content forms
- Privacy policy URL (`/privacy`)
- Terms URL (`/terms`) — recommended
- Screenshots + feature graphic
- Data safety section
- Internal testing track before production

## 6) Important notes

- Never use `localhost` in `APP_URL` for Play Store builds.
- Keep API and customer app on HTTPS.
- Location permission is used for delivery map on the shop page — describe this in Data safety and privacy policy.
- After each app update, bump `versionCode` in `apps/mobile/android/app/build.gradle`.
