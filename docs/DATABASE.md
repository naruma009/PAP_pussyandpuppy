# Database

## Current state

FastAPI current API queries now use SQLAlchemy 2.x sessions and Core statements. SQLite remains a local/test compatibility backend initialized from SQLAlchemy metadata. The real `pal2paw` PostgreSQL schema is initialized and application connectivity has been verified through the development tunnel; data migration and production deployment are not complete.

The legacy Flask app uses a separate SQLite file at `instance/pap.db` and root `schema.sql`. FastAPI runtime guards reject the legacy database and upload paths.

## Target and operating rules

- Target database: PostgreSQL 16 on an external server.
- Development connection: through an SSH tunnel when required by the environment.
- The tunnel is development infrastructure only; it is not a production deployment model.
- Production integration is not complete until deployment, operational controls, and data migration are addressed.
- Application configuration must be read from `.env`/hosting environment configuration. Never hardcode credentials.
- Never put a real host, password, private key, or connection string in documentation or Git.
- Schema changes must use a migration mechanism. Do not rely on startup-only ad hoc schema mutation.
- Define backups, rollback, indexes, constraints, transaction behavior, and connection pooling before production cutover; details are TBD.

## M2 connectivity status

- SSH tunnel to the development PostgreSQL endpoint passed; local endpoint is `localhost:5434`.
- PostgreSQL connectivity through the tunnel passed at the local TCP endpoint.
- The `pal2paw` PostgreSQL database exists; its schema is now initialized by Alembic.
- FastAPI application connectivity and core PostgreSQL smoke behavior were verified as `prem` through the tunnel.
- No PostgreSQL SQL, schema creation, migration, or application database change was performed in M2B.

## M2C1 foundation status

- SQLAlchemy 2.x, Alembic, and psycopg 3 dependencies are declared for the backend.
- `DATABASE_URL` is read from environment/.env configuration without logging or embedding credentials.
- SQLAlchemy foundation retains SQLite fallback for the existing local test suite.
- Alembic initial revision `m2c1_initial` defines `users`, `products`, `orders`, `order_items`, and `settings` with constraints and indexes.
- Application API persistence has been ported to SQLAlchemy; the initial migration was applied to the development `pal2paw` database in M2D.

## M2C2 persistence status

- Products, orders, order items, customer order history, admin order listing, stock updates, rollback, and the existing settings migration marker use SQLAlchemy sessions.
- SQLite compatibility tests remain green, including concurrent stock protection.
- Raw `sqlite3` remains only in test fixtures/legacy characterization support; current `backend/app` query code no longer imports it.
- PostgreSQL schema initialization and core smoke coverage are complete for M2D; data migration and production deployment remain outstanding.

## M2D PostgreSQL status

- Alembic revision `m2c1_initial` initialized `alembic_version`, `users`, `products`, `orders`, `order_items`, and `settings`.
- Required foreign keys, constraints, and core indexes were verified with read-only catalog queries.
- PostgreSQL application connectivity and temporary-data product/order/stock smoke tests passed through `localhost:5434`.
- SQLite/local demo data migration has not started, and no account/auth data was created.
