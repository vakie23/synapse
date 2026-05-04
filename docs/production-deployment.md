# Production Deployment Guide

This guide deploys the app stack to production:

- API (`apps/api`)
- Web (`apps/web`)
- Admin (`apps/admin`)

## 1) Prepare Environment Variables

Copy values from `.env.example` and set real production values in your host:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `CORS_ORIGINS` (comma-separated public domains)
- `API_BASE_URL` (for web/admin services)

## 2) Deploy on Render

This repo already includes `render.yaml` with three services.

Steps:

1. Push repository to GitHub.
2. In Render, create a Blueprint deployment from this repo.
3. Review all three services:
   - `synapse-api`
   - `synapse-web`
   - `synapse-admin`
4. Set secret environment variables (those marked `sync: false`).
5. Deploy.

## 3) Data Persistence

The API uses SQLite at `apps/api/data/hardware.sqlite`.

`render.yaml` mounts a persistent disk to:

`/opt/render/project/src/apps/api/data`

This preserves products, quotations, and orders across restarts.

## 4) Post-Deploy Checks

- `https://<api-domain>/health` returns `{ "status": "ok" }`
- Web loads and can create quotation
- Admin loads and can read quotations/orders
- CORS allows only your public domains

## 5) Production Hardening (Recommended)

- Rotate `ADMIN_SESSION_SECRET` to a long random value.
- Use strong admin credentials.
- Add uptime monitoring.
- Back up SQLite disk snapshots regularly.
