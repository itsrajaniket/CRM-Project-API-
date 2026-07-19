# Phase 7 — Notifications

**Prerequisite:** Phases 1-6 complete (this phase wires up trigger points left as stubs in earlier phases).

**Goal:** The notification system that powers the slide-out panel shown in every portal.

## 1. Model — Notification
```js
{
  company_id: ObjectId ref Tenant, required
  target_user_id: ObjectId ref User    // null = broadcast to everyone in the company
  type: enum ['Lead','Payment','System','Profile'], required
  title: String, required
  message: String
  is_read: Boolean, default false
  created_at: Date
}
```

## 2. Endpoints
All under `/api/notifications`, `requireAuth`, scoped to `req.user.company_id` AND (`target_user_id === null OR target_user_id === req.user.id`).

| Endpoint | Method | Params | Response |
|---|---|---|---|
| `/notifications` | GET | `page`, `unread_only` | list, newest first |
| `/notifications/:id/read` | PATCH | — | marks one as read |
| `/notifications/read-all` | PATCH | — | marks all (visible to this user) as read |

## 3. Wiring into earlier phases
Go back to each phase and connect the notification-creation calls that were stubbed:
- Phase 2: `POST /leads` -> "New Lead" notification
- Phase 3: none required by default (add if mentor wants attendance alerts)
- Phase 4: `POST /clients/:id/interactions` with `type === 'Payment Done'` -> "Payment Received"
- Phase 6: successful purchase -> "Payment Received"
- Phase 1/Profile updates (if built) -> "Profile Update Successfully" / "Password Update Successful"

This should be a single shared helper function, e.g. `createNotification({ company_id, target_user_id, type, title, message })`, called from controllers — not duplicated logic in each place.

## 4. Done when
- Creating a Lead, logging a Payment Done interaction, and completing a purchase each generate the correct notification automatically (no manual frontend call needed)
- Mark-as-read and mark-all-read work correctly
- A user only ever sees notifications for their own company, and only broadcast ones or ones targeted at them specifically
