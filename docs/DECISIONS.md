# Decisions

- Project branding is **pal2paw**.
- Target architecture is **React + FastAPI + PostgreSQL 16**.
- The result must be a real usable web application, not a demo or localhost-only service.
- The product has a customer storefront and an admin back office.
- Backend authentication and authorization are authoritative; frontend visibility is not security.
- Core commerce functionality must be complete before decorative or experimental features.
- Legacy code will not be expanded when the current React/FastAPI implementation already replaces that responsibility.
- Schema changes use migrations.
- Secrets do not enter Git or project documentation.
- Legacy Flask/Vanilla runtime remains separate until controlled cutover; do not begin a replacement migration without inspecting current implementation first.
