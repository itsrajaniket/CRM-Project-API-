# CRM Backend — Build Overview
**Read this file first, before any phase file.**

## What this is
A backend API for a multi-tenant CRM SaaS with 3 portals: CRM User (subscribing business), Super Admin (platform owner), Super Admin Telecaller (platform staff). Full context is in the companion planning doc (CRM_API_Plan_v3.md) — this folder turns that plan into buildable phases.

## How to use these files (for the AI code editor)
- Build **one phase file at a time**, in order (01, 02, 03...). Do not skip ahead.
- Each phase file is self-contained: goal, data model, endpoints, business logic, assumptions, and "done" criteria.
- Lines marked **[ASSUMPTION]** are decisions made without mentor confirmation, just to keep building moving. Implement them as written, but keep the code easy to change (don't hardcode assumption-dependent logic in more than one place).
- After finishing a phase, list which endpoints were built and any deviations from the spec, before moving to the next phase.
- If a phase references something in `DECISIONS-NEEDED.md`, implement the stated default behavior and add a `// TODO: confirm with mentor` comment at that line.

## Tech Stack [ASSUMPTION — confirm with mentor, see DECISIONS-NEEDED.md #5]
- **Runtime:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (jsonwebtoken), password hashing via bcrypt
- **File uploads:** multer (local disk for now; swap to S3/Cloudinary later — keep the upload function isolated in one module so swapping is a one-file change)
- **Validation:** express-validator or Zod (pick one, use consistently)

## Project Structure
```
/src
  /config       -> db connection, env loading
  /models       -> Mongoose schemas (one file per entity)
  /controllers  -> route handler logic
  /routes       -> Express routers, grouped by resource
  /middleware   -> auth (JWT verify + role check), tenant-scoping, error handler
  /utils        -> helpers (OTP generator, GST calculator, response formatter, etc.)
server.js
.env.example
```

## Cross-cutting conventions (apply to every phase)

**Standard response format** — every endpoint returns this shape:
```json
{ "success": true, "data": {}, "message": "Operation successful" }
```
On error:
```json
{ "success": false, "data": null, "message": "Human-readable error" }
```

**Multi-tenancy** — every document that isn't global config carries a `company_id`. A middleware (`requireAuth`) decodes the JWT, attaches `req.user = { id, role, company_id }`, and every query in every controller must filter by `req.user.company_id`. Never trust a `company_id` sent in the request body.

**Role-based access** — a second middleware (`requireRole(['Admin'])`) blocks routes by role. Apply per-route, not globally.

**Soft delete** — `DELETE` endpoints set `is_deleted: true` and `deleted_at: <timestamp>`. All `GET`/`list` queries must exclude `is_deleted: true` by default.

**Passwords** — always bcrypt-hashed before saving. Never return `password` field in any API response — exclude it explicitly in every query (`.select('-password')`) or schema `toJSON` transform.

**IDs in responses** — when a response includes a reference to another user (e.g., `telecaller_id`), resolve it to at least `{ id, full_name }` rather than returning a bare ID, wherever the UI is known to display a name (check the phase file for specifics).

## Environment Variables (`.env.example`)
```
PORT=5000
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=10
```

## Phase Index
| File | Covers |
|---|---|
| 01-setup-and-auth.md | Project scaffold, DB connection, User/Tenant models, all Auth endpoints |
| 02-leads-module.md | Leads Management CRUD (CRM User portal) |
| 03-telecaller-attendance-module.md | Telecaller CRUD, Clock-in/out, Breaks |
| 04-work-history-interactions-module.md | Client interaction logging, Work History table |
| 05-superadmin-client-module.md | Super Admin's Client Management CRUD |
| 06-subscription-revenue-module.md | Subscription plans, purchase flow, Revenue dashboard |
| 07-notifications-module.md | Notification schema + endpoints, auto-triggered from other modules |

## Definition of "good enough to demo" for every phase
- All listed endpoints respond correctly via Postman/curl with realistic sample data
- Auth + tenant scoping enforced (can't see another company's data)
- No crashes on missing/malformed input — return a clean error, not a stack trace
- Does not need: full test suite, production security hardening, or the unresolved mega-form (Section 4 of the plan doc) — skip that until confirmed
