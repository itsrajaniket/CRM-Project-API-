# Phase 2 — Leads Management (CRM User Portal)

**Prerequisite:** Phase 1 complete (Auth working, `requireAuth` + `requireRole` middleware available).

**Goal:** Full CRUD for the CRM User's own Leads pipeline. This is a simple entity — do NOT pull in tax/shipping/custom-field data here (that's the unresolved mega-form, see 00-OVERVIEW.md and DECISIONS-NEEDED.md #3).

## 1. Model — Lead
```js
{
  company_id: ObjectId ref Tenant, required   // auto-set from req.user, never from body
  full_name: String, required
  phone_number: String, required
  email_id: String
  country: String
  state: String
  city: String
  street: String
  pincode: String
  customer_interaction: String   // free text label shown in the list table, e.g. "New Lead", "Contacted"
  date_time: Date
  subject: String                 // short 2-4 word description
  is_deleted: Boolean, default false
  created_at: Date
}
```

## 2. Endpoints
All under `/api/leads`. All require `requireAuth` + role `Admin` (the CRM User).

| Endpoint | Method | Request Body | Response |
|---|---|---|---|
| `/leads` | GET | query params: `page`, `limit`, `search` | paginated list, scoped to `req.user.company_id`, excludes `is_deleted` |
| `/leads/:id` | GET | — | single lead, 404 if not found or wrong company_id |
| `/leads` | POST | `{ full_name, phone_number, email_id, country, state, city, street, pincode, customer_interaction, date_time, subject }` | created lead |
| `/leads/:id` | PUT | same fields, partial allowed | updated lead |
| `/leads/:id` | DELETE | — | soft delete (`is_deleted: true`) |

## 3. Business logic notes
- `company_id` is always taken from the authenticated user's JWT, never from the request body — this is the tenant-isolation rule from 00-OVERVIEW.md. Reject/ignore any `company_id` field sent in the body.
- `search` query param should match against `full_name`, `phone_number`, or `email_id` (case-insensitive partial match).
- Pagination default: `page=1`, `limit=10` (matches the "Showing 1 to 8 of 12 Entries" pattern seen in the UI).
- `customer_interaction` here is a simple label field (e.g. from the list table: "New Lead", "Not Interested", "Contacted", "Interested") — **[ASSUMPTION]** treat as free text for now rather than a strict enum, since the exact allowed values weren't confirmed on this specific screen (don't confuse with the Interaction Type enum in Phase 4, which is a different, confirmed list). Flag in DECISIONS-NEEDED.md #4.

## 4. Notification side-effect
On successful `POST /leads`, also create a Notification document: `{ company_id, target_user_id: null, type: 'Lead', title: 'New Lead', message: '<full_name> was added as a new lead' }`. (If Phase 7 isn't built yet, stub this as a no-op function call so it's easy to wire in later — don't skip writing the call site.)

## 5. Done when
- Full CRUD works via Postman, scoped correctly per company_id (test with two different logged-in companies, confirm no cross-visibility)
- Search and pagination work
- Deleted leads disappear from GET list but the record still exists in the DB with `is_deleted: true`
