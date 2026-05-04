# API Contracts (MVP)

## Public Customer APIs
- `GET /health`
- `GET /api/products?search=&category=`
- `GET /api/products/:id`
- `POST /api/cart/price` (calculates subtotal and delivery)
- `POST /api/orders` (place order with payment choice)
- `GET /api/orders/:id` (track status)

## Admin APIs
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`

## Request/Response Rules
- JSON only.
- Validation errors return `400` with field-level messages.
- Unknown resources return `404`.
- Server errors return `500` with trace id.
