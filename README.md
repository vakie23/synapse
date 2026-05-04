# Synapse Engineering Hardware Supplies App

Accessible ecommerce starter for Synapse Engineering to sell electrical hardware online, generate quotations, support delivery tracking, and expose API services.

## Apps
- `apps/api`: Backend API for products, cart pricing, orders, and admin operations.
- `apps/web`: Customer-facing web app with landing page and quotation page.
- `apps/admin`: Internal admin dashboard shell.
- `apps/mobile`: React Native starter app.

## Quick Start
1. Install dependencies: `npm install`
2. Run apps: `npm run dev`
3. API health: `http://localhost:4000/health`
4. Web app: `http://localhost:3000`
5. Admin app: `http://localhost:3200`
6. Quotation page: `http://localhost:3000/quotation`

## Business Features
- Front page with company name, service summary, and contact actions.
- Second page with electrical items, prices, and quotation workflow.
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

### Google Play
- The `apps/mobile` folder is the starter for your Android app.
- Next production step is to migrate it to Expo or full React Native Android build, connect it to the same API, generate a signed Android app bundle, and publish it to Google Play Console.

## Documentation
- `docs/mvp-scope.md`
- `docs/delivery-pricing.md`
- `docs/api-contracts.md`

## Accessibility Baseline
- Semantic HTML landmarks in web/admin pages.
- Keyboard and screen-reader-friendly content structure.
- Accessibility checks integrated via CI gates (expandable).
