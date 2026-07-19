# Decisions Needed From Mentor

Every item below has a **default assumption already implemented** in the phase files, so building isn't blocked. This file exists so you can walk through them with your mentor in one sitting and update the relevant phase file if any answer differs from the default.

| # | Question | Default assumption (already coded) | Where it's used |
|---|---|---|---|
| 1 | How are Super Admin Telecallers scoped, given they're not a real signed-up business? | A fixed internal "platform tenant" record, seeded manually, that all SATelecaller users belong to | 01-setup-and-auth.md |
| 2 | Should Forgot Password actually send a real email/SMS with the OTP? | For now, OTP is just logged to console/returned in a dev-only response field — no real email service wired up | 01-setup-and-auth.md |
| 3 | Does the CRM USER COMPONENT "mega-form" (Tax/GSTIN/Shipping/Transport/Custom Fields/Account Details/Attachments) belong to a real screen? | Not built at all in this plan — skipped until confirmed | 00-OVERVIEW.md, 02-leads-module.md |
| 4 | Is `customer_interaction` on a Lead a fixed set of allowed values (like the Interaction Type enum) or free text? | Free text for now | 02-leads-module.md |
| 5 | Telecaller Management UI shows plaintext passwords to Admin — intentional, or should this change? | Deviated from the literal design: passwords are always hashed, never returned in any response, regardless of what the UI mockup shows | 03-telecaller-attendance-module.md |
| 6 | Does clock-out need a two-step "preview the alert, then confirm" flow, or does one call just save immediately and the frontend decides whether to show a warning based on the returned status? | Two-step (`?confirm=false` then `?confirm=true`) implemented | 03-telecaller-attendance-module.md |
| 7 | How do the three different "Client"-ish concepts relate: (a) a Lead in the CRM User's own pipeline, (b) a Client a Telecaller is calling (Work History), (c) a Client business from Super Admin's view? | Treated as 3 separate/loosely-linked concepts for now — not merged | 02, 04, 05 |
| 8 | Is the Super Admin's "Client" a new collection, or just Super-Admin-only fields/endpoints on top of the existing Tenant model? | Treated as an extension of Tenant, not a separate collection | 05-superadmin-client-module.md |
| 9 | Can a Client/Tenant be created two ways — self-service signup AND direct Super Admin creation — or should one of these not exist? | Both flows implemented as valid | 01-setup-and-auth.md, 05-superadmin-client-module.md |
| 10 | Tech stack confirmation — Node/Express/MongoDB assumed throughout. Correct? | All phase files assume this stack | 00-OVERVIEW.md, all phases |
| 11 | Is there an existing database/schema to match, or is this a greenfield design? | Assumed greenfield | all phases |
| 12 | Scope for v1 — build all 7 phases, or stop after CRM User Portal (Phases 1-4)? | All 7 phases planned, but can stop after Phase 4 for a first demo | 00-OVERVIEW.md |

## How to use this in a mentor review
Walk through the table top to bottom. For each row, mentor either says "yes, that assumption is fine" (no change needed) or gives a different answer (update the "Where it's used" phase file's relevant [ASSUMPTION] block and note the change here with a date).
