# Flask API contracts to preserve

All frontend requests currently use same-origin URLs and cookies. Successful JSON field names and relevant HTTP status codes must remain stable when ported.

## Products

- `GET /api/products` -> `200` array of products
- `GET /api/products/{id}` -> `200` product or `404 { "error": string }`
- `POST /api/products` -> multipart form, admin required, `201` product
- `PUT /api/products/{id}` -> multipart form, admin required, `200` product
- `DELETE /api/products/{id}` -> admin required, `204`

Product response fields:

`id`, `name`, `description`, `price`, `stock`, `category`, `petType`, `ageGroup`, `image`, `emoji`, `featured`, `createdAt`, `updatedAt`.

## Customer session and orders

- `POST /api/customer/login` -> JSON `{ name, email }`, `200 { customer }`
- `POST /api/customer/logout` -> `204`
- `GET /api/customer/session` -> `200 { customer: object|null }`
- `GET /api/customer/orders` -> customer required, `200` array
- `POST /api/orders` -> customer required, JSON `{ items, shipping }`, `201 { order }`

Order creation must continue to validate products and stock server-side, calculate authoritative totals, decrement stock, and commit the order atomically.

## Admin

- `POST /api/admin/login` -> JSON `{ code }`
- `POST /api/admin/logout` -> `204`
- `GET /api/admin/session` -> `{ authenticated: boolean }`
- `GET /api/admin/orders` -> admin required
- `POST /api/admin/migrate` -> admin required, compatibility-only

## Shared behavior

- Protected endpoints return `401` when their session is absent.
- Validation failures use `{ "error": string }` with the existing endpoint status code.
- `/api/*` responses use `Cache-Control: no-store`.
- Uploads larger than the configured limit return `413`.

## M1 addition

- `GET /api/health` -> `200 { "status": "ok", "service": "pap-fastapi" }`

The health endpoint does not access SQLite, uploads, sessions, or legacy business logic.
