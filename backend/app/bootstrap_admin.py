"""Interactive, one-time bootstrap for a role-based admin account.

Run with ``python -m app.bootstrap_admin`` from the backend directory. The
password is read with getpass and is never accepted as a command-line value.
"""
from datetime import datetime, timezone
from getpass import getpass

from sqlalchemy import select, update

from app.auth import hash_password
from app.config import Settings, get_settings
from app.models import users
from app.postgres import create_database_engine, create_session_factory


def bootstrap_admin(settings: Settings, email: str, password: str | None = None, name: str | None = None) -> str:
    normalized_email = email.strip().casefold()
    if not normalized_email or "@" not in normalized_email or " " in normalized_email:
        raise ValueError("A valid admin email is required")
    engine = create_database_engine(settings)
    factory = create_session_factory(engine)
    try:
        with factory.begin() as db:
            existing = db.execute(select(users).where(users.c.email.ilike(normalized_email))).mappings().first()
            if existing and existing["role"] == "admin":
                return "already_admin"
            if existing:
                db.execute(update(users).where(users.c.id == existing["id"]).values(role="admin", status="active"))
                return "promoted"
            if not password or len(password) < 8:
                raise ValueError("Admin password must be at least 8 characters")
            if not name or not name.strip():
                raise ValueError("Admin name is required")
            now = datetime.now(timezone.utc)
            db.execute(users.insert().values(
                email=normalized_email,
                full_name=name.strip(),
                password_hash=hash_password(password),
                role="admin",
                status="active",
                created_at=now,
                updated_at=now,
            ))
            return "created"
    finally:
        engine.dispose()


def main() -> None:
    settings = get_settings()
    email = input("Admin email: ")
    engine = create_database_engine(settings)
    factory = create_session_factory(engine)
    try:
        with factory() as db:
            existing = db.execute(select(users).where(users.c.email.ilike(email.strip().casefold()))).mappings().first()
    finally:
        engine.dispose()
    if existing and existing["role"] == "admin":
        print("Admin already exists; no changes made.")
        return
    if existing:
        if input("Promote this existing account to admin? [y/N] ").strip().lower() != "y":
            print("No changes made.")
            return
        print(bootstrap_admin(settings, email))
        return
    name = input("Admin display name: ")
    password = getpass("Admin password: ")
    confirmation = getpass("Confirm admin password: ")
    if password != confirmation:
        raise SystemExit("Passwords do not match")
    print(bootstrap_admin(settings, email, password, name))


if __name__ == "__main__":
    main()
