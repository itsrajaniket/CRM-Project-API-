# Phase 3 — Telecaller Management, Attendance & Breaks

**Prerequisite:** Phases 1-2 complete.

**Goal:** Telecaller CRUD (Admin-side provisioning), plus the Attendance/Break time-tracking engine (Telecaller-side self-service). This is the most logic-heavy phase — take it slow on the clock-out math.

## 1. Models

### Telecaller
Telecaller accounts are `User` documents with `role: 'Telecaller'`, scoped by `company_id` to the Admin who created them (see Phase 1 User model — no separate schema needed, just query `User.find({ role: 'Telecaller', company_id })`).

**Note on visible passwords:** the UI shows plain-text passwords to the Admin in the Telecaller table. **[FLAGGED — do not implement as shown.]** Store passwords bcrypt-hashed as normal. For the "Add Telecaller" flow, the Admin sets an initial password in plain text in the form — hash it before saving, and do not return it in any GET response. See DECISIONS-NEEDED.md #5 for the open question to raise with mentor; this is a case where we deliberately deviate from the literal Figma for security.

### Attendance
```js
{
  user_id: ObjectId ref User, required        // the telecaller
  company_id: ObjectId ref Tenant, required
  date: Date, required                         // normalized to 00:00:00 that day
  shift_start_time: Date, required
  shift_end_time: Date
  expected_minutes: Number, default 540        // 9 hours
  net_work_minutes: Number, default 0          // calculated on clock-out
  status: enum ['Active','Full Day','Half Day','Absent'], default 'Active'
}
```

### Break
```js
{
  attendance_id: ObjectId ref Attendance, required
  user_id: ObjectId ref User, required
  break_type: enum ['Lunch Break','Tea Break','Meeting','Training','Other - Personal'], required
  reason: String    // only used/required when break_type === 'Other - Personal'
  start_time: Date, required
  end_time: Date
  duration_minutes: Number, default 0
}
```

## 2. Endpoints

### Telecaller CRUD — `/api/telecallers` (Admin role, company-scoped)
| Endpoint | Method | Body / Params | Response |
|---|---|---|---|
| `/telecallers` | GET | `page`, `limit`, `search`, `status` | paginated list, excludes password |
| `/telecallers/:id` | GET | — | single telecaller |
| `/telecallers` | POST | `{ full_name, phone_number, email_id, password, profile_image }` | created (role forced to 'Telecaller', company_id from req.user) |
| `/telecallers/:id` | PUT | same fields, partial | updated |
| `/telecallers/:id` | DELETE | — | soft delete |
| `/telecallers/:id/status` | PATCH | `{ status: 'Active'|'Inactive' }` | toggles status |
| `/telecallers/:id/attendance` | GET | `month`, `year` | attendance history + summary counts |
| `/telecallers/:id/breaks` | GET | `date` | that day's breaks |

### Attendance & Breaks (self-service, Telecaller role, acts on their own user_id from JWT)
| Endpoint | Method | Body | Response |
|---|---|---|---|
| `/attendance/clock-in` | POST | — | creates today's Attendance doc if none exists yet; error if already clocked in |
| `/attendance/clock-out` | PUT | — | runs the math engine below, returns `{ status, net_work_minutes, alert_type }` |
| `/attendance/today` | GET | — | current shift state: net work time so far, net break time, remaining time, expected clock-out |
| `/attendance/history` | GET | `month`, `year` | own history |
| `/breaks/start` | POST | `{ break_type, reason? }` | creates open Break (no end_time); error if another break already open |
| `/breaks/:id/end` | PUT | — | sets end_time, calculates duration_minutes |
| `/breaks/active` | GET | — | currently open break, if any |

## 3. Clock-out math engine (implement exactly, in this order)
1. Find today's Attendance doc for this user; error if none (never clocked in).
2. If any Break for this attendance_id has no `end_time`, auto-close it (set end_time = now) before continuing.
3. `gross_minutes = (now - shift_start_time) in minutes`
4. `total_break_minutes = sum of duration_minutes across all Breaks for this attendance_id`
5. `net_work_minutes = gross_minutes - total_break_minutes`
6. Determine status:
   - `net_work_minutes >= expected_minutes` -> `'Full Day'`, alert_type `'full_day'`
   - `net_work_minutes >= expected_minutes * 0.5` (and less than full) -> `'Half Day'`, alert_type `'half_day'`
   - below that -> alert_type `'very_early'` (status stays pending until the frontend confirms — see note)
7. **[ASSUMPTION]** the three alert screens shown in Figma imply the frontend asks for confirmation before finalizing. Design the endpoint as two-step: `PUT /attendance/clock-out?confirm=false` returns the calculated status/alert without saving, so frontend can show the warning modal; `PUT /attendance/clock-out?confirm=true` actually saves. Confirm this two-step pattern with mentor (DECISIONS-NEEDED.md #6) — if wrong, it's a small change to one endpoint.
8. On confirm, set `shift_end_time = now`, save `net_work_minutes` and final `status`.

## 4. Done when
- Clock-in -> take 2+ breaks -> end each break -> clock-out returns correct net_work_minutes and status for at least 3 test scenarios (very early, half day, full day)
- Attendance history returns correct daily summaries + month totals (Total Work Days, Full Day, Half Day, Absent counts)
- Telecaller CRUD works, company-scoped, passwords never appear in any response
