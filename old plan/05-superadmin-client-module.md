# Phase 5 — Super Admin: Client Management

**Prerequisite:** Phases 1-4 complete.

**Goal:** Super Admin's CRUD over Client businesses (i.e., the CRM User companies subscribed to the platform). This is a different, business-level entity from the Lead in Phase 2 and the lightweight Client-lookup in Phase 4 — see DECISIONS-NEEDED.md #7 on how these should eventually reconcile.

## 1. Model — Client (Super Admin's view of a Tenant)
This can either be a new collection, or (more likely, given it maps 1:1 to company signups) additional fields on the existing **Tenant** model from Phase 1, viewed through Super Admin-only endpoints. **[ASSUMPTION]** treat this as the Tenant model extended, not a separate collection, to avoid duplicating business data. Confirm with mentor (DECISIONS-NEEDED.md #8).

Fields needed on Tenant (add if not already present from Phase 1):
```js
{
  // existing Tenant fields from Phase 1, plus:
  client_name: String        // the primary contact/owner name
  status: enum ['Active','Inactive'], default 'Active'   // already exists, reused here
}
```

## 2. Endpoints
All under `/api/admin/clients`, `requireAuth` + role `SuperAdmin`. NOT company-scoped in the usual sense — Super Admin sees across all tenants.

| Endpoint | Method | Body / Params | Response |
|---|---|---|---|
| `/admin/clients` | GET | `page`, `limit`, `search`, `status` | paginated list across all Tenants: client_name, business_name, phone_number, email_id, status |
| `/admin/clients/:id` | GET | — | full Tenant detail (client + business info) |
| `/admin/clients` | POST | `{ client_name, phone_number, email_id, profile_image, business_name, business_logo, business_email_id, business_phone_no, team_size, gstin_no, website }` | creates a new Tenant directly (Super Admin-initiated signup) |
| `/admin/clients/:id` | PUT | same fields, partial | updates Tenant |
| `/admin/clients/:id` | DELETE | — | soft delete |
| `/admin/clients/:id/status` | PATCH | `{ status }` | toggles Active/Inactive |

## 3. Business logic notes
- This endpoint set intentionally overlaps with the self-service `/auth/register` + `/auth/business-setup` flow from Phase 1 — both can create a Tenant. **[ASSUMPTION]** both paths are valid (self-signup vs Super-Admin-provisioned) — this is DECISIONS-NEEDED.md #9, flag for mentor.
- `requireRole(['SuperAdmin'])` is critical here — a regular Admin must never be able to hit these routes and see other companies' data.

## 4. Done when
- Super Admin can list/view/create/edit/deactivate Client businesses across multiple test tenants
- A regular Admin (non-SuperAdmin) JWT is rejected with 403 on all these routes
