# Phase 4 — Work History & Client Interactions

**Prerequisite:** Phases 1-3 complete.

**Goal:** Logging telecaller touchpoints against Client businesses, and the Work History table / timeline views that read them back.

**Note on "Client" here:** in this phase, "Client" refers to a Business that a Telecaller is calling/following up with (matches the "Work History" and "Interaction Details" screens on the CRM User side). This is a lighter-weight reference than the full Super Admin Client entity in Phase 5 — for now, treat it as a simple lookup table. See DECISIONS-NEEDED.md #7 for how these two "Client" concepts should ultimately relate.

## 1. Model — Interaction
```js
{
  client_id: ObjectId ref Client, required
  company_id: ObjectId ref Tenant, required
  telecaller_id: ObjectId ref User, required
  mode: enum ['Call','WhatsApp','Email'], required
  type: enum [
    'Call Connect','Call Disconnect','Follow Up','Payment Done',
    'Interested','Not Interested','Busy','Switched Off','Call Back',
    'Language Barrier','Number Invalid','Voice Mail','Not Received'
  ], required
  follow_up_date: Date    // required only if type === 'Follow Up'
  notes: String
  created_at: Date
}
```

## 2. Endpoints
All under `/api`, `requireAuth`, company-scoped.

| Endpoint | Method | Body / Params | Response |
|---|---|---|---|
| `/clients` | GET | `filter=today\|yesterday\|custom`, `date` (if custom), `page`, `search` | Work History table: business_name, phone_number, subscription_plan, interaction_mode, latest_interaction, per row |
| `/clients/export` | GET | same filters | CSV or JSON export of the above |
| `/clients/:id/interactions` | GET | — | timeline, newest first, `telecaller_id` resolved to `{ id, full_name }` |
| `/clients/:id/interactions` | POST | `{ mode, type, follow_up_date?, notes? }` | creates Interaction, `telecaller_id` taken from `req.user.id` |

## 3. Business logic notes
- Validate: if `type === 'Follow Up'`, `follow_up_date` is required; reject otherwise with a clear message.
- `GET /clients/:id/interactions` must populate/join `telecaller_id` to return `full_name` — the UI shows "Updated By: [Telecaller Name]", never a raw ID.
- "Latest Interaction" column on the list = the `type` of the most recent Interaction for that client (a derived/computed value — either query it live with a sort+limit(1) per client, or maintain a denormalized `latest_interaction` field on the Client doc updated on every new Interaction; pick whichever is simpler to implement first, note the choice in your phase summary).
- Optional stretch goal (only if time allows): `GET /interactions/pending-followups` — returns interactions where `type === 'Follow Up'` and `follow_up_date` is today or earlier, for a future reminder feature. Not required for "done."

## 4. Notification side-effect
On `POST /clients/:id/interactions` where `type === 'Payment Done'`, create a Notification: `{ type: 'Payment', title: 'Payment Received', ... }`.

## 5. Done when
- Can log an interaction of each type against a test client, including the Follow Up date-required validation
- Work History list correctly filters by today/yesterday/custom date
- Interaction timeline shows resolved telecaller names, sorted newest-first
