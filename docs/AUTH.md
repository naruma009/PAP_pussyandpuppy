# Authentication and authorization

## Customer

- Real customer endpoints: `POST /api/customer/register`, `POST /api/customer/login` with email/password, `GET /api/customer/me`, and `POST /api/customer/logout`.
- Customer accounts use the `users` table and Argon2id password hashes. The password hash is never returned by the API or stored in the session.
- The session stores only the authenticated user ID in the existing HttpOnly, SameSite=Lax cookie; Secure is enabled for production settings.
- `GET /api/customer/session` remains available for the current frontend contract, and the legacy name/email demo login remains temporarily compatible for backend compatibility/tests; the normal React customer UI no longer uses it.
- Customer-protected endpoints include order creation and customer order history.
- Self-registration accepts customer fields only; role/admin fields are ignored and cannot grant admin access.
- React now provides real Register/Login/Logout UI, restores the session on app load, and uses the authenticated session for checkout and customer orders. Email verification, recovery, MFA, CSRF strategy, rate limiting, and account lifecycle controls remain outstanding.

## Admin

- Current endpoints: `POST /api/admin/login`, `GET /api/admin/session`, `POST /api/admin/logout`.
- Real admin login accepts email/password only for an active `users` row with `role=admin`; the identity session stores the user ID and every admin guard looks up the role server-side.
- Admin product CRUD, admin orders, and the legacy migration endpoint call the backend admin guard.
- Shared-code admin authentication has been removed. React admin uses the real email/password login and role-backed session restore; frontend hiding alone is not the security boundary.
- The initial real admin account has been bootstrapped through the interactive management mechanism; credentials are not stored in source or documentation.

## Production requirements

Backend authorization must remain authoritative for every protected operation. Customer password/session foundations and role-based backend admin authorization are implemented, but define password policy evolution, credential rotation, session expiry/revocation, CSRF strategy where applicable, rate limiting, audit logging, and recovery/MFA before release.

Payment initiation is customer-identity scoped server-side. Stripe webhook signatures are verified against the raw request body; browser success/cancel redirects are informational only and cannot mark an order paid.
