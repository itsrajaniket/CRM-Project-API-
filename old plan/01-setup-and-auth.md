# Phase 1 — Project Setup & Authentication

**Goal:** Scaffold the project and build every Auth endpoint for all 3 roles (Admin/CRM User, SuperAdmin, Telecaller). Nothing else works without this phase.

## 1. Scaffold
- Initialize Node + Express project per structure in 00-OVERVIEW.md
- Connect to MongoDB via Mongoose
- Set up global error-handling middleware (catches thrown errors, returns standard error shape)
- Set up the standard response helper (`sendSuccess(res, data, message)` / `sendError(res, message, statusCode)`)

## 2. Models

### Tenant (Company)
```js
{
  business_name: String, required
  logo_url: String
  team_size: String
  website: String
  business_email: String, required
  business_phone: String
  gst_number: String
  subscription_plan_id: ObjectId ref SubscriptionPlan  // null until upgraded
  status: enum ['Active','Inactive'], default 'Active'
  is_platform_tenant: Boolean, default false  // true only for the Super Admin's own internal tenant — see note below
  created_at: Date
}
```
**[ASSUMPTION]** `is_platform_tenant` is how Super Admin Telecallers get scoped — they belong to one fixed internal Tenant record created at DB seed time, not a real signed-up business. Confirm with mentor (see DECISIONS-NEEDED.md #1).

### User
```js
{
  company_id: ObjectId ref Tenant, required
  role: enum ['SuperAdmin','Admin','Telecaller','SATelecaller'], required
  full_name: String, required
  email: String, required, unique
  password: String, required (bcrypt hashed)
  phone: String
  profile_image: String
  status: enum ['Active','Inactive'], default 'Active'
  is_deleted: Boolean, default false
  created_at: Date
}
```
Exclude `password` from all query results by default (schema-level `select: false` on the field, or `toJSON` transform).

### OTP (or embed in User — pick one, keep consistent)
```js
{
  user_id: ObjectId ref User, required
  code: String, required        // 6-digit
  expires_at: Date, required     // now + OTP_EXPIRY_MINUTES
  used: Boolean, default false
}
```

## 3. Endpoints

All under `/api/auth` unless noted. Role-specific login endpoints all use the same controller logic, differing only in which `role` value is expected/set.

| Endpoint | Method | Auth | Request Body | Response |
|---|---|---|---|---|
| `/auth/register` | POST | none | `{ full_name, email, phone, password }` | creates User (role=Admin, unverified/pending), creates a placeholder Tenant, returns `{ user_id }` |
| `/auth/business-setup` | POST | Bearer (partial — the just-registered user) | `{ business_name, logo_url, team_size, website, business_email, business_phone, gst_number }` | completes the Tenant record for this user's company_id |
| `/auth/login` | POST | none | `{ email, password }` | verifies bcrypt, returns `{ token, user: { id, full_name, email, role, company_id } }` |
| `/admin/auth/login` | POST | none | same as above | same, but only succeeds if `role === 'SuperAdmin'` |
| `/sa-telecaller/auth/login` | POST | none | same as above | same, but only succeeds if `role === 'SATelecaller'` |
| `/auth/forgot-password` | POST | none | `{ email }` | generates 6-digit OTP, saves with expiry, [ASSUMPTION: logs OTP to console instead of real email/SMS for now — see DECISIONS-NEEDED.md #2] |
| `/auth/verify-otp` | POST | none | `{ email, otp }` | validates code + expiry, marks used, returns a short-lived reset token |
| `/auth/reset-password` | POST | none | `{ email, otp_reset_token, new_password, confirm_password }` | validates match, bcrypt-hashes, updates User |

## 4. JWT payload shape
```json
{ "id": "...", "role": "Admin", "company_id": "..." }
```
Set `JWT_EXPIRES_IN` from env. `requireAuth` middleware verifies and attaches to `req.user`.

## 5. Business logic notes
- `register` should NOT immediately create a usable login — the flow is Create Account -> Business Setup -> then account is fully active. Decide: is a user "active" after register (before business setup) able to log in and get redirected to business-setup, or fully blocked until setup completes? **[ASSUMPTION]** allow login but return a flag `business_setup_complete: false` in the login response so frontend can redirect. Flag for mentor confirmation.
- OTP expiry: reject if `now > expires_at` even if code matches.
- Never reveal whether an email exists or not in `forgot-password` response (respond success either way) — basic security hygiene.

## 6. Done when
- Can register -> complete business setup -> login -> receive valid JWT, for all 4 roles (seed a SuperAdmin and SATelecaller manually via a seed script since there's no public signup for those roles)
- Wrong password / unknown email return clean 401, not a crash
- Forgot/verify/reset password flow works end to end with a real OTP round-trip
- `GET` on any protected route without a token returns 401
