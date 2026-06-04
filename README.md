# Synapse Engineering Hardware Supplies App

Accessible ecommerce starter for Synapse Engineering to sell electrical hardware online, generate quotations, support delivery tracking, and expose API services.

## Apps
- `apps/api`: Backend API for products, cart pricing, orders, and admin operations.
- `apps/web`: Customer-facing web app with landing page and shop (quotations + orders).
- `apps/admin`: Internal admin dashboard shell.
- `apps/mobile`: Capacitor wrapper that loads the deployed web app for Google Play publishing.

## Quick Start
1. Install dependencies: `npm install`
2. Sync product images (once): `powershell -ExecutionPolicy Bypass -File scripts/sync-synapse-images.ps1`
3. Run apps: `npm run dev`
4. API health: `http://localhost:4000/health`
5. Web app: `http://localhost:3000`
6. Admin app: `http://localhost:3200` (also at `http://localhost:3000/admin`)
7. Shop: `http://localhost:3000/shop` (request a quotation or place an order)
8. Run API tests: `npm run test -w @hardware/api`

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

### Google Play
- The `apps/mobile` folder now includes a Capacitor wrapper for publishing to Google Play.
- Configure `APP_URL` to your deployed web domain, then run:
  - `npm run android:init -w @hardware/mobile`
  - `npm run android:sync -w @hardware/mobile`
  - `npm run android:open -w @hardware/mobile`
- Build a signed Android App Bundle (`.aab`) in Android Studio and upload to Play Console.
- Full publishing steps: `docs/google-play-publishing.md`

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
