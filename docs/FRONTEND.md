# Frontend

## Current React/Vite frontend

The current frontend is under `frontend/`, using React, React Router, Vite, and Vitest. Important canonical routes include:

- `/` pet selection; `/home` storefront home
- `/products` catalog; `/products/:productId` product detail
- `/cart`, `/login`, `/register`, `/checkout`, `/account/orders`
- `/health`
- `/admin` admin application

Legacy `.html` URLs are routed through React compatibility aliases, including product, cart, login, checkout, and admin URLs.

Important feature areas include catalog/product discovery, cart and checkout, customer session/order history, admin product CRUD/order listing, preferences, and experimental personality/mascot experiences. The exact component tree is intentionally omitted; use the route or feature directory after narrowing the task.

## Storefront and admin

Customer storefront coverage exists for catalog, detail, cart, real Register/Login/Logout/session restore, checkout, and customer orders. The client sends same-origin credentials to the API and does not store passwords or tokens in browser storage. Checkout and order history require the authenticated customer session; server responses remain authoritative for order results.

Admin UI coverage exists for real email/password login/session restore/logout, product create/update/delete, stock fields, uploads, order listing, and canonical order status management. Admin status controls call the role-protected backend endpoint and do not offer transitions from terminal orders. The React admin UI no longer calls the deprecated shared-code endpoint.

Customer order history displays translated canonical statuses (`pending`, `processing`, `shipped`, `completed`, and `cancelled`) without exposing mutation controls. Each order renders its customer/shipping snapshot, item quantity/unit price/subtotal, authoritative total, payment status, and payment button when eligible. Minimal payment success/cancel pages never mark an order paid; only verified backend webhooks do that. Admin order cards render the same snapshot details and reuse the M4B status controls.

## Legacy frontend

Root `*.html`, `css/`, and `js/` are the legacy Vanilla implementation. Do not add new feature work there when a current React equivalent exists. Preserve compatibility aliases until the cutover decision is explicit.

## Production gaps

Production serving/build output and full end-to-end browser verification are not established by repository inspection alone. API requests use `VITE_API_BASE_URL` (default `/api`); same-origin builds use same-origin cookies and an explicitly configured cross-origin API uses credentialed requests. `VITE_DEV_API_TARGET` remains Vite-proxy-only for localhost development. Frontend variables must never contain backend or Stripe secrets. Admin identity/role migration also remains TBD.
