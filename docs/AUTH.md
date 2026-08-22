# Authentication and authorization

## Customer

- Real customer endpoints: `POST /api/customer/register`, `POST /api/customer/login` with email/password, `GET /api/customer/me`, and `POST /api/customer/logout`.
- Customer accounts use the `users` table and Argon2id password hashes. The password hash is never returned by the API or stored in the session.
- The session stores only the authenticated user ID in the existing HttpOnly, SameSite=Lax cookie; Secure is enabled for production settings.
- `GET /api/customer/session` remains available for the current frontend contract, and the legacy name/email demo login remains temporarily compatible until the frontend replacement lands.
- Customer-protected endpoints include order creation and customer order history.
- Self-registration accepts customer fields only; role/admin fields are ignored and cannot grant admin access.
- Frontend Register/Login replacement, email verification, recovery, MFA, CSRF strategy, rate limiting, and account lifecycle controls remain outstanding.

## Admin

- Current endpoints: `POST /api/admin/login`, `GET /api/admin/session`, `POST /api/admin/logout`.
- The backend compares the submitted admin code with configured application settings and stores an authenticated session flag.
- Admin product CRUD, admin orders, and the legacy migration endpoint call the backend admin guard.
- React has an admin provider/guard and an admin UI, but frontend hiding alone is not the security boundary.

## Production requirements

Backend authorization must remain authoritative for every protected operation. Customer password/session foundations are now implemented, but define password policy evolution, credential rotation, session expiry/revocation, CSRF strategy where applicable, rate limiting, audit logging, recovery/MFA, and production admin identity before release. The shared admin-code model remains unchanged and is not production-ready.
