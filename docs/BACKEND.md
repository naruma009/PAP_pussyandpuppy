# Backend

## FastAPI structure

The current backend is under `backend/app/`. `main.py` creates the FastAPI app, installs session middleware and request protections, and mounts routers. `config.py` loads `PAP_API_` settings plus environment-only database, Stripe, and Supabase settings; `db.py` provides SQLAlchemy sessions and local SQLite initialization compatibility. `postgres.py` provides the engine/session foundation and `models.py` defines the current Core table metadata. `api/index.py` is the Vercel ASGI entrypoint.

## API groups

- Health: `/api/health` is liveness only; `/api/ready` checks that the configured database is usable and returns 503 without internal diagnostics when it is not.
- Catalog: `GET /api/products`, `GET /api/products/{id}`
- Customer: register, real email/password login, current-user/session/logout, `GET /api/customer/orders`, and identity-scoped `GET /api/customer/orders/{id}`; legacy name/email demo login remains temporarily compatible
- Orders: `POST /api/orders` with customer guard, server-side stock/total validation, transaction handling, canonical payment state (`unpaid` by default), customer-owned `POST /api/customer/orders/{id}/checkout-session`, and signed `POST /api/payments/stripe/webhook`
- Admin: role-aware email/password login/session/logout, `GET /api/admin/orders`, `GET /api/admin/orders/{id}`, `PATCH /api/admin/orders/{id}/status`, and development-only `/api/admin/migrate`; every protected operation requires an active user with `role=admin`
- Product management: admin-protected `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}`

Product image uploads are sent from FastAPI to the public Supabase Storage bucket with server-only credentials. Uploads use generated UUID names, return full public URLs, and safe deletion accepts only URLs belonging to the configured Supabase project/bucket. FastAPI does not serve `/uploads/products`. API responses use an `error` field for the tested error contract.

Production configuration is environment-driven: `PAP_API_ENV`, `DATABASE_URL`, `PAP_API_SECRET_KEY`, `PAP_API_PUBLIC_ORIGIN`, optional CORS/cookie settings, Stripe settings, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `SUPABASE_STORAGE_BUCKET`. `backend/.env.example` contains names and safe placeholders only. Production startup does not initialize schema; Alembic remains an explicit release step against the direct database connection. Vercel runtime uses the pooler URL and the committed `api/index.py`; local process deployment can still use Uvicorn without `--reload`.

State-changing cookie-authenticated API requests reject an explicit unknown `Origin`; the Stripe webhook is exempt from this origin check and continues to verify its raw request body with `Stripe-Signature`.

## Legacy backend

Root `app.py` is the Flask implementation of the same broad catalog, cart/order, auth/session, admin, migration, and upload behaviors. It uses the legacy SQLite path and must remain separate from FastAPI data until controlled cutover.

## Gaps before production

The FastAPI persistence layer uses SQLAlchemy with serverless-safe PostgreSQL options and SQLite test compatibility. Supabase RLS and Storage code are implemented and Storage has passed a bounded live upload/read/delete smoke test. Customer/admin identity, order lifecycle, stock restoration, immutable snapshots, and Stripe Checkout test-mode code are implemented. Vercel Preview routing/runtime readiness, hosted cookie behavior, Stripe webhook delivery, admin bootstrap against the target database, observability, and operational controls are not yet confirmed complete.
