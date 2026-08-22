# Database

## Current state

FastAPI runtime queries still use Python `sqlite3` and `backend/app/schema.sql`. PostgreSQL foundation code now provides SQLAlchemy engine/session setup, environment-only `DATABASE_URL` configuration, and Alembic scaffolding; application query cutover has not started.

The legacy Flask app uses a separate SQLite file at `instance/pap.db` and root `schema.sql`. FastAPI runtime guards reject the legacy database and upload paths.

## Target and operating rules

- Target database: PostgreSQL 16 on an external server.
- Development connection: through an SSH tunnel when required by the environment.
- The tunnel is development infrastructure only; it is not a production deployment model.
- Integration is not complete until the application is tested against the real PostgreSQL service. Current SQLite tests do not prove this.
- Application configuration must be read from `.env`/hosting environment configuration. Never hardcode credentials.
- Never put a real host, password, private key, or connection string in documentation or Git.
- Schema changes must use a migration mechanism. Do not rely on startup-only ad hoc schema mutation.
- Define backups, rollback, indexes, constraints, transaction behavior, and connection pooling before production cutover; details are TBD.

## M2 connectivity status

- SSH tunnel to the development PostgreSQL endpoint passed; local endpoint is `localhost:5434`.
- PostgreSQL connectivity through the tunnel passed at the local TCP endpoint.
- The `pal2paw` PostgreSQL database exists and currently has no tables, as confirmed for M2 planning.
- FastAPI application integration with PostgreSQL has not started.
- No PostgreSQL SQL, schema creation, migration, or application database change was performed in M2B.

## M2C1 foundation status

- SQLAlchemy 2.x, Alembic, and psycopg 3 dependencies are declared for the backend.
- `DATABASE_URL` is read from environment/.env configuration without logging or embedding credentials.
- SQLAlchemy foundation retains SQLite fallback for the existing local test suite.
- Alembic initial revision `m2c1_initial` defines `users`, `products`, `orders`, `order_items`, and `settings` with constraints and indexes.
- Application API queries still run through the SQLite layer; PostgreSQL migration has not been run against any server.
