# Synapse Engineering — Hardware Supplies App

Customer app (web + Google Play), admin dashboard, and API for Synapse Engineering electrical hardware supplies.

## Apps
- `apps/api`: Backend API for products, cart pricing, orders, and admin operations.
- `apps/web`: Customer app — shop, quotations, orders (powers website and Google Play app).
- `apps/admin`: Internal admin dashboard shell.
- `apps/mobile`: Capacitor Android project for **Google Play Store** publishing.

## Quick Start
1. Install dependencies: `npm install`
2. Sync product images (once): `powershell -ExecutionPolicy Bypass -File scripts/sync-synapse-images.ps1`
3. Run locally: `npm run dev`
4. API health: `http://localhost:4000/health`
5. Customer app: `http://localhost:3000`
6. Admin: `http://localhost:3200` (also at `http://localhost:3000/admin`)
7. Shop: `http://localhost:3000/shop`
8. API tests: `npm run test -w @hardware/api`

## Business Features
- Front page with company name, service summary, and contact actions.
- Shop page with electrical items, prices, quotation requests, and order checkout.
- Customer quotation API endpoint: `POST /api/quotation`
- Delivery location capture with customer GPS coordinates.
- Goods-in-transit tracking endpoint: `GET /api/orders/:id/tracking`
- Direct contact via email and phone links.

## API Highlights
- `GET /api/company`
- `GET /api/products`
- `GET /api/categories`
- `POST /api/quotation`
- `POST /api/orders`
- `GET /api/orders/:id/tracking`

## Data Persistence
- The app now uses a local SQLite-compatible database powered by `sql.js`.
- Database file location: `apps/api/data/hardware.sqlite`
- Products, quotations, and orders now persist across server restarts.

## Deployment Targets
### GitHub
- Push this repository to GitHub as your main source control.
- Use GitHub Actions from `.github/workflows/ci.yml` for automated build checks.

### Render
- Deploy this repo to Render using the `render.yaml` manifest at the repository root.
- `render.yaml` defines three services: `synapse-api`, `synapse-web`, and `synapse-admin`.
- Each service runs a production-ready build (`npm run build --workspaces --if-present`) and starts the compiled JS bundle with `node dist/server.js`.
- Set Render environment variables for production credentials such as `ADMIN_SESSION_SECRET`, API base URLs, and any map or payment API keys.
- Full deployment steps: `docs/production-deployment.md`

### Google Play (Android app)
1. Deploy API and customer app to Render (HTTPS).
2. Set production URLs:
   ```powershell
   $env:APP_URL="https://your-app.onrender.com"
   $env:API_URL="https://your-api.onrender.com"
   ```
3. Build and sync Android project:
   ```powershell
   npm run app:prepare
   npm run app:open
   ```
4. Create signed AAB in Android Studio (or `npm run app:bundle` with keystore).
5. Upload to [Google Play Console](https://play.google.com/console).

Full checklist: `apps/mobile/PLAYSTORE.md` and `docs/google-play-publishing.md`

## Documentation
- `docs/mvp-scope.md`
- `docs/delivery-pricing.md`
- `docs/api-contracts.md`
- `docs/production-deployment.md`
- `docs/google-play-publishing.md`

## Accessibility Baseline
- Semantic HTML landmarks in web/admin pages.
- Keyboard and screen-reader-friendly content structure.
- Expand accessibility automation in CI as the UI grows.
