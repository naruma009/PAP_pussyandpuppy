# Backend

## FastAPI structure

The current backend is under `backend/app/`. `main.py` creates the FastAPI app, installs session middleware and request protections, mounts routers, and serves product uploads. `config.py` loads `PAP_API_` settings from `.env`; `db.py` currently provides SQLite connections and schema initialization.

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

The FastAPI persistence layer must be replaced or extended for PostgreSQL 16, with migration tooling and real integration tests. Customer registration/account identity, production-grade admin identity/roles, admin order mutations, payment integration, deployment configuration, observability, and operational controls are not confirmed complete.
