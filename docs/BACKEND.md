# Backend

## FastAPI structure

The current backend is under `backend/app/`. `main.py` creates the FastAPI app, installs session middleware and request protections, mounts routers, and serves product uploads. `config.py` loads `PAP_API_` settings plus environment-only `DATABASE_URL`; `db.py` provides SQLAlchemy sessions and local SQLite initialization compatibility. `postgres.py` provides the engine/session foundation and `models.py` defines the current Core table metadata.

## API groups

- Health: `/api/health`
- Catalog: `GET /api/products`, `GET /api/products/{id}`
- Customer: login/session/logout and `GET /api/customer/orders`
- Orders: `POST /api/orders` with customer guard, server-side stock/total validation, and transaction handling
- Admin: login/session/logout, `GET /api/admin/orders`, and development-only `/api/admin/migrate`
- Product management: admin-protected `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}`

Uploads are handled by FastAPI under the configured non-legacy upload directory. API responses use an `error` field for the tested error contract.

## Legacy backend

Root `app.py` is the Flask implementation of the same broad catalog, cart/order, auth/session, admin, migration, and upload behaviors. It uses the legacy SQLite path and must remain separate from FastAPI data until controlled cutover.

## Gaps before production

The FastAPI persistence layer is now ported to SQLAlchemy, but PostgreSQL 16 application integration and real PostgreSQL tests remain outstanding until M2D. Alembic migrations must be run through the deployment process rather than startup DDL. Customer registration/account identity, production-grade admin identity/roles, admin order mutations, payment integration, deployment configuration, observability, and operational controls are not confirmed complete.
