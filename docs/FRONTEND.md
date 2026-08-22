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

Admin UI coverage exists for login/session, product create/update/delete, stock fields, uploads, and order listing. Order status management is not evidenced by the current API/UI.

## Legacy frontend

Root `*.html`, `css/`, and `js/` are the legacy Vanilla implementation. Do not add new feature work there when a current React equivalent exists. Preserve compatibility aliases until the cutover decision is explicit.

## Production gaps

Production serving/build output, API origin configuration, HTTPS/cookie behavior, error monitoring, accessibility/performance acceptance, and full end-to-end browser verification are not established by repository inspection alone. Admin identity/role migration also remains TBD.
