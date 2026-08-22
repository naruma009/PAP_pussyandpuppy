# Authentication and authorization

## Customer

- Current endpoint: `POST /api/customer/login`, accepting a name and email; session is stored server-side through the FastAPI session middleware.
- Current session endpoints: `GET /api/customer/session`, `POST /api/customer/logout`.
- Customer-protected endpoints include order creation and customer order history.
- The React login page and customer guard consume this session.
- No customer register endpoint, password credential flow, persistent customer model, email verification, recovery, or MFA was found. This is demo authentication, not production-ready customer identity.

## Admin

- Current endpoints: `POST /api/admin/login`, `GET /api/admin/session`, `POST /api/admin/logout`.
- The backend compares the submitted admin code with configured application settings and stores an authenticated session flag.
- Admin product CRUD, admin orders, and the legacy migration endpoint call the backend admin guard.
- React has an admin provider/guard and an admin UI, but frontend hiding alone is not the security boundary.

## Production requirements

Backend authorization must remain authoritative for every protected operation. Before production, define customer accounts and password/session/token policy, admin roles, credential storage, rotation, session expiry/revocation, CSRF strategy where applicable, rate limiting, audit logging, and recovery/MFA requirements. These are not confirmed complete in the repository and are therefore TBD.
