# Backend

## FastAPI structure

The current backend is under `backend/app/`. `main.py` creates the FastAPI app, installs session middleware and request protections, mounts routers, and serves product uploads. `config.py` loads `PAP_API_` settings plus environment-only `DATABASE_URL`; `db.py` provides SQLAlchemy sessions and local SQLite initialization compatibility. `postgres.py` provides the engine/session foundation and `models.py` defines the current Core table metadata.

## API groups

- Health: `/api/health`
- Catalog: `GET /api/products`, `GET /api/products/{id}`
- Customer: register, real email/password login, current-user/session/logout, and `GET /api/customer/orders`; legacy name/email demo login remains temporarily compatible
- Orders: `POST /api/orders` with customer guard, server-side stock/total validation, and transaction handling
- Admin: role-aware email/password login/session/logout, `GET /api/admin/orders`, and development-only `/api/admin/migrate`; every protected operation requires an active user with `role=admin`
- Product management: admin-protected `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}`

Uploads are handled by FastAPI under the configured non-legacy upload directory. API responses use an `error` field for the tested error contract.

## Legacy backend

Root `app.py` is the Flask implementation of the same broad catalog, cart/order, auth/session, admin, migration, and upload behaviors. It uses the legacy SQLite path and must remain separate from FastAPI data until controlled cutover.

## Gaps before production

The FastAPI persistence layer is now ported to SQLAlchemy, and PostgreSQL schema/data plus customer and admin authentication have been verified. Customer and admin passwords use Argon2id hashes and the existing secure session cookie stores only a user reference. Admin authorization uses the `users.role` value looked up server-side, and the interactive getpass-based bootstrap CLI has created the initial admin account. Alembic migrations must be run through the deployment process rather than startup DDL. Production deployment, admin order mutations, payment integration, observability, and operational controls are not confirmed complete.
