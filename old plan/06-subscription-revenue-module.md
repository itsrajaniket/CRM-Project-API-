# Phase 6 — Subscriptions & Revenue

**Prerequisite:** Phases 1-5 complete.

**Goal:** Subscription plan CRUD (Super Admin), the purchase/upgrade flow (CRM User side), and the Revenue dashboard (Super Admin side).

## 1. Models

### SubscriptionPlan
```js
{
  plan_name: String, required        // Silver, Gold, Platinum (Free is the default/no-plan state, not a row here — see note)
  plan_price: Number, required
  validity_days: Number, required
  max_users: Number, required        // "Share Access With User"
  support_24x7: Boolean, default false
  is_active: Boolean, default true   // Super Admin can retire old plans without deleting history
  created_at: Date
}
```
**Note:** "Free" appears as a plan label in the UI but has no price/features to configure — treat it as the default state of a Tenant with `subscription_plan_id: null`, not an actual SubscriptionPlan row.

### Transaction
```js
{
  company_id: ObjectId ref Tenant, required
  plan_id: ObjectId ref SubscriptionPlan, required
  transaction_id: String, required, unique   // external reference, user-entered per the "Enter Transaction ID" field
  base_amount: Number, required
  discount_percent: Number, default 0
  tax_amount: Number, required               // 18% GST — ALWAYS calculated server-side
  total_paid: Number, required               // ALWAYS calculated server-side
  payment_method: enum ['Online','Telecaller'], required
  sold_by_telecaller_id: ObjectId ref User    // null if payment_method is 'Online'
  status: enum ['Pending','Successful','Failed'], default 'Successful'
  created_at: Date
}
```

## 2. Endpoints

### Subscription CRUD — `/api/admin/subscriptions` (SuperAdmin role)
| Endpoint | Method | Body | Response |
|---|---|---|---|
| `/admin/subscriptions` | GET | — | list of plans |
| `/admin/subscriptions/:id` | GET | — | single plan |
| `/admin/subscriptions` | POST | `{ plan_name, plan_price, validity_days, max_users, support_24x7 }` | created |
| `/admin/subscriptions/:id` | PUT | same, partial | updated |
| `/admin/subscriptions/:id` | DELETE | — | soft delete (or set `is_active: false`) |

### Purchase flow — `/api/subscriptions/purchase` (Admin role, or SATelecaller role selling on behalf of a client)
| Endpoint | Method | Body | Response |
|---|---|---|---|
| `/subscriptions/purchase` | POST | `{ plan_id, discount_percent, transaction_id, payment_method, sold_by_telecaller_id? }` | creates Transaction with server-calculated totals; updates Tenant's `subscription_plan_id` |

**Server-side calculation (do not trust any amount from the request body):**
```
base_amount = plan.plan_price
discount_amount = base_amount * (discount_percent / 100)
discounted = base_amount - discount_amount
tax_amount = discounted * 0.18
total_paid = discounted + tax_amount
```

### Revenue — `/api/admin/revenue` (SuperAdmin role)
| Endpoint | Method | Params | Response |
|---|---|---|---|
| `/admin/revenue/summary` | GET | — | `{ total_revenue, revenue_online, revenue_telecaller }` for current month + % change vs last month |
| `/admin/revenue/transactions` | GET | `page`, `search` | paginated list: transaction_id, client_name (resolved), plan, amount, sold_by (resolved name or "Online"), status |
| `/admin/revenue/transactions/:id` | GET | — | full Payment Details receipt view |

**Revenue summary logic:**
1. Filter Transactions: `status === 'Successful'` and `created_at` within current month
2. Group by `payment_method`
3. Sum `total_paid` per group -> `revenue_online`, `revenue_telecaller`
4. `total_revenue = revenue_online + revenue_telecaller`
5. Repeat for previous month to compute `% change`

## 3. Notification side-effect
On successful purchase, create Notification: `{ type: 'Payment', title: 'Payment Received', target_user_id: null }` for the purchasing company, AND a separate one for Super Admin's own notification feed if applicable.

## 4. Done when
- Can create 3 plans (Silver/Gold/Platinum), purchase one as a test company with a discount, and see the GST/total math is correct
- Revenue summary correctly splits Online vs Telecaller sales
- Transaction detail view resolves client name and seller name, not raw IDs
