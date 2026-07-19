# CRM Project — API Planning Document (v3)
**Prepared by:** [Your Name]
**Changelog from v2:** Added multi-tenancy pattern, soft delete, standard response format, notification schema, file upload approach, and password security notes (cross-checked against an AI-generated MERN doc). Corrected a schema-merging mistake found in that doc — see Section 8.

---

## 0. App Overview (unchanged from v2)

3 portals: **CRM User Portal** (subscribing business), **Super Admin Portal** (platform owner), **Super Admin Telecaller** (platform's own outreach staff).

**Confirmed distinction (do not merge):**
- **Lead** — a prospect inside one CRM User business's own pipeline (simple fields)
- **Client** — a whole CRM User business, as seen by Super Admin (business-level fields)
- **Business Setup** — the onboarding form a CRM User fills once at signup

---

## 1. Architecture Principles (new in v3)

- **Multi-tenancy:** every record (Leads, Telecallers, Interactions, Transactions) carries a `company_id` / `tenant_id`. A middleware auto-injects the logged-in user's company_id into every query, so one company can never see another's data.
- **Standard API response shape:**
  ```json
  { "success": true, "data": {}, "message": "Operation successful" }
  ```
- **Soft delete:** `DELETE` endpoints set `is_deleted: true` rather than removing the row — preserves history for Interactions/Revenue that reference the deleted record.
- **Password hashing:** all passwords hashed with bcrypt before storage; `change-password` endpoints compare old password with bcrypt before allowing update.
- **File uploads:** profile images / business logos go through upload middleware to cloud storage (S3/Cloudinary); the database stores only the resulting URL string, never the file itself.

**Open concern to raise with mentor:** the Telecaller Management table (Admin view) displays each Telecaller's password in plain text (e.g. "Password@123"). This conflicts with standard password-hashing practice above. Worth asking whether this is intentional (e.g., an admin-set temporary password shown once) or a design placeholder that should change.

---

## 2. Auth Module

| Screen | Endpoint | Method | Key Fields |
|---|---|---|---|
| CRM User Login | `/auth/login` | POST | email, password |
| Super Admin Login | `/admin/auth/login` | POST | email, password |
| Super Admin Telecaller Login | `/sa-telecaller/auth/login` | POST | email, password |
| Create Account | `/auth/register` | POST | full_name, email, phone_number, password |
| Business Setup - Basic | `/auth/business-setup` | POST | business_name, logo, team_size, website, business_email, business_phone_number, gst_number |
| Forgot Password | `/{role}/auth/forgot-password` | POST | email -> generates 6-digit OTP, 10-min expiry |
| Verify OTP | `/{role}/auth/verify-otp` | POST | email, otp |
| Reset Password | `/{role}/auth/reset-password` | POST | new_password, confirm_password |

**Role handling:** login returns a JWT carrying a `role` claim (SuperAdmin / Admin / Telecaller / SATelecaller) so the frontend routes to the correct portal. This also resolves the "two Telecaller pools" question from v2 — both can live in one `users` table if `company_id` scopes CRM User Telecallers to their business and Super Admin Telecallers to the platform's own internal tenant. Still worth confirming with mentor, but it's a clean way to unify without losing separation.

---

## 3. CRM User Portal

### 3.1 Dashboard
```
GET /dashboard/summary
GET /telecallers/:id/work-summary
```

### 3.2 Profile
```
GET   /profile
PUT   /profile
POST  /profile/change-password
GET   /notifications
PATCH /notifications/mark-all-read
PATCH /notifications/:id/read
```

### 3.3 Leads Management (Entity: Lead — simple pipeline, NOT the mega-form)
```
GET    /leads
GET    /leads/:id
POST   /leads
PUT    /leads/:id
DELETE /leads/:id        (soft delete)
```
**Fields (confirmed from actual Add/Edit Lead screens):** full_name, phone_number, email_id, country, state, city, street, pincode, customer_interaction, date_time, subject

### 3.4 Telecaller Management (Entity: Telecaller)
```
GET    /telecallers
GET    /telecallers/:id
POST   /telecallers
PUT    /telecallers/:id
DELETE /telecallers/:id
PATCH  /telecallers/:id/status
GET    /telecallers/:id/attendance?month=&year=
GET    /telecallers/:id/breaks?date=
```
**Fields:** profile_image, full_name, phone_number, email_id, password (see security concern above), status

### 3.5 Attendance & Breaks (two linked tables, not embedded arrays)
```
POST /attendance/clock-in
PUT  /attendance/clock-out
GET  /attendance/history?month=&year=
GET  /work-schedule

POST /breaks/start   { type, reason? }
PUT  /breaks/:id/end
GET  /breaks/active
```
**Clock-out logic (server-side, in order):**
1. Auto-close any open break tied to this shift
2. Calculate gross time = clock_out - clock_in
3. Sum all break durations for the shift
4. net_work_time = gross_time - total_break_time
5. Compare net_work_time to required_hours -> assign status: full_day / half_day / very_early (or absent, per company policy)
6. Save final Attendance record; return status so frontend shows the matching alert

### 3.6 Work History / Client Interactions
```
GET  /clients?filter=today|yesterday|custom&date=
GET  /clients/export
GET  /clients/:id/interactions
POST /clients/:id/interactions
POST /clients/:id/upgrade-plan
```
**Interaction fields:** mode (Call/WhatsApp/Email), type (enum below), follow_up_date (only if type = Follow Up), notes

**Interaction Type enum:** Call Connect, Call Disconnect, Follow Up, Payment Done, Interested, Not Interested, Busy, Switched Off, Call Back, Language Barrier, Number Invalid, Voice Mail, Not Received

Response for `GET /clients/:id/interactions` should resolve telecaller_id into a readable name (join/populate), not just return raw IDs — the UI timeline shows "Updated By: [Telecaller Name]".

---

## 4. Unresolved: The "Mega-Form" Component Library

The CRM USER COMPONENT library page contains 6 large form sections (Basic Info with GSTIN/Tax, Shipping From/To, Transport Details, Custom Fields, Account Details, Attachments) that do not match the fields on any confirmed live screen we've seen. They may belong to:
- (a) A future/unbuilt "Business full profile" screen, or
- (b) Reusable sections meant to be assembled differently across screens, or
- (c) Leftover/unused design work

**Question for mentor:** which real screen(s), if any, use these components? Don't build a database schema for this until confirmed — building it into the Lead or Client schema (as the other AI's draft did) risks a bloated, wrong data model.

---

## 5. Super Admin Telecaller (own limited portal)

Sidebar: Dashboard, Client, Daily Work Report. Reuses Attendance/Breaks/Interaction endpoints from Section 3.5-3.6, scoped to the `sa-telecaller` role and the platform's own tenant.

---

## 6. Super Admin Portal

### 6.1 Client Management (Entity: Client — a whole CRM User business)
```
GET    /admin/clients
GET    /admin/clients/:id
POST   /admin/clients
PUT    /admin/clients/:id
DELETE /admin/clients/:id
PATCH  /admin/clients/:id/status
```
**Fields (confirmed from Add/Edit Client Details screens):** client_name, phone_number, email_id, profile_image, business_name, business_logo, business_email_id, business_phone_no, team_size, gstin_no, website

### 6.2 Telecaller Management (separate pool, same shape as 3.4)
`/admin/telecallers/...`

### 6.3 Subscription Management (Entity: Subscription)
```
GET    /admin/subscriptions
GET    /admin/subscriptions/:id
POST   /admin/subscriptions
PUT    /admin/subscriptions/:id
DELETE /admin/subscriptions/:id
```
**Fields:** plan_name, plan_price, validity_days, max_users, support_24x7

### 6.4 Revenue / Payment (Entity: Transaction)
```
GET /admin/revenue/summary
GET /admin/revenue/transactions
GET /admin/revenue/transactions/:id
POST /subscriptions/purchase
```
**Transaction fields:** transaction_id, client_id, plan_id, base_amount, discount_percent, tax_amount (18% GST, calculated server-side — never trust a frontend-sent total), total_paid, payment_method (Online/Telecaller), sold_by_telecaller_id (nullable — null means Online, filled means Telecaller sale), status (Pending/Successful/Failed)

**Revenue summary logic:** filter transactions to current month + status=Successful, group by payment_method, sum total_paid — produces the Total/Online/Telecaller revenue cards.

**Security note:** the discount % and GST math must be recalculated and verified server-side on `POST /subscriptions/purchase`, never trusted from the frontend — otherwise a modified request could apply an unauthorized discount.

---

## 7. Notifications (all roles)
```json
{
  "company_id": "...",
  "target_user_id": "... | null",
  "type": "Lead | Payment | System | Profile",
  "title": "New Lead",
  "message": "...",
  "is_read": false,
  "created_at": "..."
}
```
`target_user_id: null` means broadcast to the whole company. Notifications are written by the backend automatically as a side effect of other actions (e.g., after `POST /leads` succeeds, also create a "New Lead" notification) — never created directly by a frontend call.
```
GET   /notifications
PATCH /notifications/:id/read
PATCH /notifications/read-all
```

---

## 8. What Was Corrected From the AI-Generated Doc

| Their approach | Issue | Fix in this version |
|---|---|---|
| Merged Lead + Client + mega-form into one "Client" schema | Conflates 3 different screens/entities with different field sets | Kept Lead, Client, and Business Setup separate; flagged mega-form as unresolved (Section 4) |
| No mention of plaintext password display | Real screen shows visible passwords to Admin | Flagged as a security question for mentor (Section 1) |
| Assumed MERN/MongoDB specifically | Tech stack not yet confirmed with mentor | Kept field/endpoint definitions tech-agnostic; MERN is one valid option pending Q5 below |

---

## 9. Open Questions for Mentor

1. Does the CRM USER COMPONENT "mega-form" (Tax/Shipping/Custom Fields/Account Details) belong to a real screen? Which one?
2. Are Telecaller passwords intentionally shown in plain text to Admins, or should this change?
3. Confirm: one `users` table with `role` + `company_id` scoping, or fully separate tables per role?
4. Does Super Admin create Client accounts directly, or only edit self-registered ones (or both)?
5. Tech stack — MERN, or something else?
6. Existing database, or design schema from scratch?
7. Scope for v1 — all 3 portals, or CRM User Portal first?
8. Can I share endpoint lists per module before coding, for review?

---

## 10. Suggested Build Order (unchanged from v2)

1. Auth (all roles)
2. CRM User: Leads CRUD
3. CRM User: Telecaller CRUD + Attendance/Breaks
4. CRM User: Dashboard aggregation
5. Work History / Interactions
6. Super Admin: Client Management
7. Super Admin: Telecaller Management
8. Super Admin: Subscription Management
9. Super Admin: Revenue/Payment
10. Notifications (all roles)
11. Resolve mega-form question, then build if confirmed
