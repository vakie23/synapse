# Google Play Publishing Guide

This project can be published with a Capacitor Android wrapper in `apps/mobile`.

**Full step-by-step checklist:** see `apps/mobile/PLAYSTORE.md`

## 1) Prerequisites

- Deployed public web URL (HTTPS) for customer app
- Android Studio installed
- Google Play Console account
- Java/Android SDK configured

## 2) Configure Mobile Wrapper URL

Set your deployed web URL:

```powershell
$env:APP_URL="https://your-web-domain.example"
```

`apps/mobile/capacitor.config.ts` uses `APP_URL` for the in-app web content.

## 3) Initialize Android Project

From repo root:

```powershell
npm run android:init -w @hardware/mobile
npm run android:sync -w @hardware/mobile
npm run android:open -w @hardware/mobile
```

## 4) Build Release AAB in Android Studio

In Android Studio:

1. Open the generated Android project.
2. Set app icon, app name, and version code/version name.
3. Build signed bundle:
   - `Build` -> `Generate Signed Bundle / APK`
   - Select `Android App Bundle (AAB)`
4. Save keystore securely (do not lose it).

## 5) Play Console Submission

Upload AAB and complete:

- App content forms
- Privacy policy URL
- Screenshots + feature graphic
- Data safety section
- Testing track (internal/closed) before production

## 6) Important Notes for This App

- Do not use localhost URLs in production.
- Keep API and web domains under HTTPS.
- Because location is used, describe location usage clearly in privacy policy.
