# Project state

## Verified current architecture

- The repository is on branch `react-fastapi-migration`.
- Current implementation includes a React/Vite frontend under `frontend/` and a FastAPI application under `backend/app/`.
- FastAPI persistence uses SQLAlchemy 2.x with SQLite retained for local/test compatibility; the development PostgreSQL schema is managed by Alembic.
- The legacy runtime remains in the repository: root-level static HTML, `css/`, `js/`, root `app.py` (Flask), root `schema.sql`, `instance/`, and `uploads/`.
- The repository also contains `migration/baseline/` contracts and compatibility notes.

## Migration status

Migration is substantially implemented for the core storefront/admin flows, but is not complete for the target production architecture.

Current React/FastAPI implementation includes:

- React routes for pet selection, home, catalog, product detail, cart, login, checkout, customer orders, health, and admin.
- FastAPI health, product catalog/detail, customer session/login/logout/orders, checkout/order creation, admin session/login/logout/orders, product CRUD, uploads, and a development-only legacy product migration endpoint.
- Legacy URL aliases in React for the former `.html` routes.
- Backend guards for customer-only and admin-only endpoints.

Legacy implementation remains independently present and is not the current target runtime. It includes the Vanilla HTML/JS UI and Flask API in `app.py`, using the legacy SQLite database and upload locations.

## Feature assessment

| Area | Repository evidence | Status |
| --- | --- | --- |
| Product catalog/detail | React pages + FastAPI GET product endpoints | Implemented in current stack; PostgreSQL connectivity verified |
| Cart | React state/local browser storage | Implemented in current stack |
| Customer login/logout | FastAPI session endpoints | Demo login only; no verified account registration/password flow |
| Customer register | No register endpoint or page found | Incomplete/TBD |
| Checkout/order creation | FastAPI validates session, stock, totals, and writes order | Implemented with SQLAlchemy; PostgreSQL smoke-verified; payment and production deployment TBD |
| Customer order history | FastAPI customer-scoped query + React page | Implemented with SQLAlchemy; PostgreSQL smoke-verified |
| Admin login | FastAPI session with configured shared admin code | Functional prototype; production identity/MFA/rotation TBD |
| Product CRUD and stock | Admin-protected FastAPI endpoints + React admin UI | Implemented in current stack; PostgreSQL smoke-verified |
| Admin order management | Admin order listing exists | Read/status/update workflow is incomplete; no admin order mutation endpoint found |
| Deployable public service | Local Vite proxy and local FastAPI defaults exist | Production deployment/cutover not verified; TBD |

## Known issues and production blockers

- PostgreSQL schema initialization and application connectivity are verified for the development `pal2paw` database; data migration and production deployment remain outstanding.
- Customer authentication is not an account system: login accepts a name and email, with no registration, password, email verification, recovery, or persistent customer table.
- Admin authentication is a single shared configured code stored in a session; a production-grade identity, authorization model, audit trail, and secret rotation are TBD.
- Checkout has no payment provider or payment state workflow in the inspected code.
- Admin order management is read-only in the current API/UI; status updates, fulfillment workflow, and auditability are TBD.
- Deployment to a persistent public frontend/backend/database is not verified. Exact hosting, HTTPS, domain, backups, observability, and scaling plan are TBD.
- Existing React/Vite configuration includes a local API proxy and a trycloudflare allowed host; these are development concerns, not proof of production deployment.
- No production end-to-end test exists; the M2D core PostgreSQL integration smoke test uses temporary data and cleans it up.

## M2D PostgreSQL status

- Alembic revision `m2c1_initial` initialized the `pal2paw` schema: `users`, `products`, `orders`, `order_items`, and `settings`.
- Application connectivity was verified against PostgreSQL 16 through the development SSH tunnel.
- Current demo data from `backend/data/admin-smoke.db` was migrated to PostgreSQL with preserved product/order relationships; the SQLite source remains in place.
- No `users` were migrated. Production deployment and operational verification are still pending.

Do not treat this document as evidence that the application is production-ready. Re-verify each TBD item before release.
