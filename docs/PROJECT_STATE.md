# Project state

## Verified current architecture

- The repository is on branch `react-fastapi-migration`.
- Current implementation includes a React/Vite frontend under `frontend/` and a FastAPI application under `backend/app/`.
- FastAPI persistence uses SQLAlchemy 2.x with SQLite retained for local/test compatibility; Supabase PostgreSQL is the hosted target and schema is managed explicitly by Alembic.
- The legacy runtime remains in the repository: root-level static HTML, `css/`, `js/`, root `app.py` (Flask), root `schema.sql`, `instance/`, and `uploads/`.
- The repository also contains `migration/baseline/` contracts and compatibility notes.

## Migration status

Migration is substantially implemented for the core storefront/admin flows, but is not complete for the target production architecture.

Current React/FastAPI implementation includes:

- React routes for pet selection, home, catalog, product detail, cart, login, checkout, customer orders, health, and admin.
- FastAPI health, product catalog/detail, customer session/login/logout/orders, checkout/order creation, admin session/login/logout/orders/status mutation, product CRUD, uploads, and a development-only legacy product migration endpoint.
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
| Admin login | React email/password UI + FastAPI role-backed session | Real identity and role-based authorization are canonical; initial admin bootstrapped |
| Product CRUD and stock | Admin-protected FastAPI endpoints + React admin UI | Implemented in current stack; PostgreSQL smoke-verified |
| Admin order management | Admin order listing + status mutation UI | Backend lifecycle and transactional cancellation restore are implemented; React admin controls and customer status display are complete |
| Deployable public service | Vercel entrypoint, same-origin routes, pinned dependencies, Supabase pooling/RLS/Storage code | Packaging verified locally; hosted Preview/cutover not yet verified |

## Known issues and production blockers

- PostgreSQL schema initialization and application connectivity are verified for the development `pal2paw` database; data migration and production deployment remain outstanding.
- Customer authentication uses persistent users and Argon2id password hashes; React Register/Login/Logout, session restoration, checkout guard, and customer order guard are implemented. Verification/recovery/MFA, rate limiting, and account lifecycle controls remain TBD.
- Admin backend authorization now uses real `users.role` identity lookup with Argon2id email/password login. Shared-code authentication has been removed; frontend admin cutover and initial bootstrap are complete. Audit trail and secret rotation remain incomplete.
- Checkout has Stripe Checkout sandbox integration and payment state workflow; public deployment and production Stripe verification remain outstanding.
- Admin order management now supports server-side status transitions and transactional cancellation stock restoration; fulfillment automation and auditability remain TBD.
- React admin order controls and customer order status labels are implemented for the canonical lifecycle; payment/fulfillment automation remains TBD.
- Public Vercel deployment is not verified. Preview/Production environment configuration, runtime readiness, Stripe webhook delivery, backups, and observability remain release blockers.
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
- Frontend customer Register/Login replacement and role-based backend admin identity are complete. Legacy demo customer backend compatibility remains for tests/transition only.

## M3C1 role-based admin authorization status

- Alembic revision `m3c1_admin_roles` added `users.role` with `customer` as the default and a customer/admin constraint; it was applied to `pal2paw` after verifying the database identity. No admin account was created.
- Real admin email/password login and server-side role guards cover admin product operations, orders, and the legacy migration endpoint.
- The interactive `python -m app.bootstrap_admin` mechanism uses getpass and Argon2id hashing for a future initial admin bootstrap; it was not run against PostgreSQL.
- React admin login/session/CRUD/orders use real identity and role-based authorization. The initial real admin was bootstrapped, and the deprecated shared-code admin path has been removed.

Do not treat this document as evidence that the application is production-ready. Re-verify each TBD item before release.

## M4A order lifecycle status

- Order status is canonicalized to `pending`, `processing`, `shipped`, `completed`, or `cancelled` by Alembic revision `m4a_order_status`.
- Admin status mutation requires the real admin role, customers receive the updated status in order history, and cancellation restores stock once within the status transaction.

## M4B order status UI

- React admin order cards display current status, offer only lifecycle-valid next statuses, refresh from the server response, and show errors without optimistic state changes.
- React customer order history displays translated status labels and never exposes status mutation controls.

## M4C production order details

- Existing order snapshot columns are reused; no Alembic revision was needed.
- Customer and admin order detail responses/UI show shipping/customer snapshots, item quantities and prices, subtotals, totals, created time, and canonical status.
- Customer order detail authorization is tied to the authenticated user identity. Existing users, products, orders, and order items are preserved.

## M5A payment foundation

- Alembic revision `m5a_payment_foundation` adds canonical payment state with `unpaid`, `pending`, `paid`, `failed`, and `refunded`; new orders default to `unpaid` and `THB`.
- Payment status is independent from order fulfillment status and is read-only to customers/admins in M5A; no manual mark-paid endpoint exists.
- A no-network provider boundary is ready for Stripe Checkout in M5B. No Stripe SDK, credentials, Checkout Session, webhook, or external call is present in M5A.

## M5B1 Stripe Checkout integration foundation

- Stripe Python SDK dependency/configuration and a customer-owned Checkout Session endpoint are implemented with backend-owned snapshot line items and THB currency.
- Signed webhook handling supports completed and async success/failure events, validates metadata/session identity/amount/currency, and is idempotent.
- React checkout/order history includes guarded payment initiation plus minimal success/cancel pages. Browser redirects are not payment authority.
- External Stripe test-mode verification, Stripe credentials, and real payment remain NOT DONE.

## M6A deployment readiness (historical plan)

- A production topology plan is documented in `docs/tasks/M6A_DEPLOYMENT_PLAN.md`.
- M6A documented the earlier VM topology before Vercel and Supabase were selected.
- The current deployment target is one Vercel project with Supabase PostgreSQL and Storage; `DEPLOYMENT.md` is now the canonical release guide.
- The historical VM plan remains useful context but is superseded for the active deployment path.

## M6B1 local production hardening

- Production configuration is environment-driven for runtime mode, session secret/cookie policy, database URL, public/CORS origins, upload directory, and Stripe URLs/secrets. No production domain or active secret is hardcoded.
- `/api/health` is liveness; `/api/ready` verifies database usability without exposing diagnostics. Production app import disables startup schema initialization; Alembic remains an explicit single release step.
- Explicit unknown origins are rejected for cookie-authenticated state changes, with Stripe raw-body signature verification preserved. Configured upload directories are resolved and created safely without migrating or deleting existing files.
- Local production hardening is ready. Vercel Preview, environment scopes, public HTTPS runtime, and deployment acceptance are NOT VERIFIED.

## Vercel and Supabase readiness

- `api/index.py`, `vercel.json`, `.vercelignore`, and pinned root/backend requirements prepare the React/FastAPI stack for one Vercel project while excluding the retired Flask stack.
- PostgreSQL runtime uses `NullPool` and disables prepared statements for the Supabase transaction pooler; SQLite test behavior is preserved.
- `m5b1_rls` protects all application tables from public REST access. A bounded publishable-key probe returned HTTP 401 and exposed no rows.
- Product image create/delete uses Supabase Storage with modern `sb_secret_` authentication through the `apikey` header. A bounded live upload/public-read/delete/list-cleanup smoke test passed.
- Backend regression passes 58 tests with 2 opt-in integration skips. Frontend regression passes 43 files / 221 tests and the production build passes.
- Vercel CLI local runtime verification is blocked until a Vercel account is authenticated and the project is linked. No Preview URL, hosted readiness result, Stripe webhook delivery, or production promotion is claimed.

## M6C1 final local end-to-end verification

- LOCAL E2E VERIFIED: frontend localhost returned 200; FastAPI `/api/health` and `/api/ready` returned 200; configured PostgreSQL readiness passed against `pal2paw`/`prem` through the local tunnel.
- Existing backend regression passed 55 tests including the two opt-in PostgreSQL smoke tests with temporary-row cleanup. Customer/admin authorization, catalog/order/status/cancellation, Stripe signature protection, cookie/CORS/origin hardening, and upload contracts are covered by the completed test suite.
- Frontend full regression passed 40 files and 218 tests using serialized Vitest workers; production build passed. The earlier 120-second timeout/EPIPE was runner termination caused by jsdom startup cost, not an application failure.
- Temporary PostgreSQL smoke rows were verified absent after cleanup; the existing admin, products, and orders remained present. No schema migration or pre-existing data deletion was performed.
- PUBLIC DEPLOYMENT NOT YET DONE. Vercel Preview/Production configuration, hosted readiness, Stripe webhook delivery, and release acceptance remain outside this local verification.

## M6C2 pre-deploy storefront cleanup

- Pre-deploy UI cleanup is complete for the current React/FastAPI flow: normal storefront/admin copy uses `pal2paw`, stale M3A/Demo wording is removed, and the existing Admin Login remains email/password-only.
- Missing upload reference `/uploads/products/legacy-32f1644b9aa643edb299ed79e9d74477.jpg` belongs to product `อาหารแมวรสโจรสลัด` (id `1786820130468`). The source file is absent; no database reference was changed. Storefront and admin image views now fall back to the product emoji without a broken-image icon. The product can receive a replacement image through Admin.
- Targeted cleanup tests passed; backend regression passed 55 tests, frontend regression passed 43 files / 221 tests, and the production build passed. No users/products/orders/payment state/schema were modified.
