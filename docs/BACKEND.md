# Backend

## FastAPI structure

The current backend is under `backend/app/`. `main.py` creates the FastAPI app, installs session middleware and request protections, mounts routers, and serves product uploads. `config.py` loads `PAP_API_` settings plus environment-only `DATABASE_URL`; `db.py` provides SQLAlchemy sessions and local SQLite initialization compatibility. `postgres.py` provides the engine/session foundation and `models.py` defines the current Core table metadata.

## API groups

- Health: `/api/health` is liveness only; `/api/ready` checks that the configured database is usable and returns 503 without internal diagnostics when it is not.
- Catalog: `GET /api/products`, `GET /api/products/{id}`
- Customer: register, real email/password login, current-user/session/logout, `GET /api/customer/orders`, and identity-scoped `GET /api/customer/orders/{id}`; legacy name/email demo login remains temporarily compatible
- Orders: `POST /api/orders` with customer guard, server-side stock/total validation, transaction handling, canonical payment state (`unpaid` by default), customer-owned `POST /api/customer/orders/{id}/checkout-session`, and signed `POST /api/payments/stripe/webhook`
- Admin: role-aware email/password login/session/logout, `GET /api/admin/orders`, `GET /api/admin/orders/{id}`, `PATCH /api/admin/orders/{id}/status`, and development-only `/api/admin/migrate`; every protected operation requires an active user with `role=admin`
- Product management: admin-protected `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}`

Uploads are handled by FastAPI under the configured non-legacy upload directory. API responses use an `error` field for the tested error contract.

Production configuration is environment-driven: `PAP_API_ENV`, `PAP_API_HOST`, `PAP_API_PORT`, `DATABASE_URL`, `PAP_API_SECRET_KEY`, `PAP_API_PUBLIC_ORIGIN`, `PAP_API_CORS_ALLOWED_ORIGINS`, `PAP_API_UPLOAD_DIR`, cookie settings, and Stripe settings. `backend/.env.example` contains names and safe placeholders only. Production startup does not run database initialization; run the approved migration release step once, then start the backend from `backend/` with `python -m uvicorn app.main:app --host ${PAP_API_HOST} --port ${PAP_API_PORT}` (PowerShell: `python -m uvicorn app.main:app --host $env:PAP_API_HOST --port $env:PAP_API_PORT`), with no `--reload` and one process-supervised instance per release.

State-changing cookie-authenticated API requests reject an explicit unknown `Origin`; the Stripe webhook is exempt from this origin check and continues to verify its raw request body with `Stripe-Signature`.

## Legacy backend

Root `app.py` is the Flask implementation of the same broad catalog, cart/order, auth/session, admin, migration, and upload behaviors. It uses the legacy SQLite path and must remain separate from FastAPI data until controlled cutover.

## Gaps before production

The FastAPI persistence layer is now ported to SQLAlchemy, and PostgreSQL schema/data plus customer and admin authentication have been verified. Customer and admin passwords use Argon2id hashes and the existing secure session cookie stores only a user reference. Admin authorization uses the `users.role` value looked up server-side, and the interactive getpass-based bootstrap CLI has created the initial admin account. Order status lifecycle, cancellation stock restoration, immutable customer/shipping/item snapshots, and Stripe Checkout test-mode integration code are implemented. External Stripe verification, production deployment, observability, and operational controls are not confirmed complete.
