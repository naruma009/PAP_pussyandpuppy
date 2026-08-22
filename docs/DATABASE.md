# Database

## Current state

FastAPI currently uses Python `sqlite3` and `backend/app/schema.sql`. The current schema has `products`, `orders`, `order_items`, and `settings`. It does not establish PostgreSQL integration.

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

No real database connection was opened for M0.
