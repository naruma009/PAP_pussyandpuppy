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
| Customer login/logout | FastAPI register/login/me/session/logout endpoints | Real customer auth is wired into the React UI; production account controls TBD |
| Customer register | FastAPI `/api/customer/register` | React registration UI implemented; email verification/recovery remain TBD |
| Checkout/order creation | FastAPI validates session, stock, totals, and writes order | Implemented with SQLAlchemy; PostgreSQL smoke-verified; payment and production deployment TBD |
| Customer order history | FastAPI customer-scoped query + React page | Implemented with SQLAlchemy; PostgreSQL smoke-verified |
| Admin login | React email/password UI + FastAPI role-backed session | React cutover complete; initial real admin bootstrap is deferred to M3C3 |
| Product CRUD and stock | Admin-protected FastAPI endpoints + React admin UI | Implemented in current stack; PostgreSQL smoke-verified |
| Admin order management | Admin order listing exists | Read/status/update workflow is incomplete; no admin order mutation endpoint found |
| Deployable public service | Local Vite proxy and local FastAPI defaults exist | Production deployment/cutover not verified; TBD |

## Known issues and production blockers

- PostgreSQL schema initialization and application connectivity are verified for the development `pal2paw` database; data migration and production deployment remain outstanding.
- Customer authentication uses persistent users and Argon2id password hashes; React Register/Login/Logout, session restoration, checkout guard, and customer order guard are implemented. Verification/recovery/MFA, rate limiting, and account lifecycle controls remain TBD.
- Admin backend authorization now uses real `users.role` identity lookup with Argon2id email/password login; the shared configured-code path is deprecated and temporarily retained for frontend compatibility. Frontend admin cutover, bootstrap operations, audit trail, and secret rotation remain incomplete.
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

## M3A customer authentication status

- Alembic revision `m3a_customer_auth` added the required `users.password_hash` column without changing the applied initial revision.
- Register/login/logout/current-user backend flows are implemented and PostgreSQL smoke-verified; test accounts are cleaned up.
- The deprecated admin shared-code session remains available for compatibility. Frontend customer Register/Login replacement is complete; the role-based backend admin identity is now implemented, while frontend admin cutover remains incomplete. Legacy demo customer backend compatibility remains for tests/transition only.

## M3C1 role-based admin authorization status

- Alembic revision `m3c1_admin_roles` added `users.role` with `customer` as the default and a customer/admin constraint; it was applied to `pal2paw` after verifying the database identity. No admin account was created.
- Real admin email/password login and server-side role guards cover admin product operations, orders, and the legacy migration endpoint.
- The interactive `python -m app.bootstrap_admin` mechanism uses getpass and Argon2id hashing for a future initial admin bootstrap; it was not run against PostgreSQL.
- The shared-code admin path is deprecated but retained for backend compatibility. React admin login/session/CRUD/orders cutover is complete; initial real admin bootstrap and removal of the backend path are deferred to M3C3.

Do not treat this document as evidence that the application is production-ready. Re-verify each TBD item before release.
