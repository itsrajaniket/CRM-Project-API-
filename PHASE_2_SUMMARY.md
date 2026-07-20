# Phase 2 Summary: Leads Management

This document provides a comprehensive breakdown of everything built in **Phase 2** of our CRM API project. It explains the new Lead engine, the flow of data, the database models used, and the APIs created, with absolutely no raw code.

## 1. What We Did in This Phase
In Phase 2, we built the core functionality of the CRM User Portal: **The Leads Engine**. We created the database structure to store potential customers and built 5 distinct API endpoints allowing users to Create, Read, Update, and Delete (CRUD) leads. Most importantly, we wired this engine directly into the Phase 1 Security system to guarantee strict **Tenant Isolation**.

## 2. Prerequisites: What is Required to Run It?
- Everything from Phase 1 must be active (Node.js, MongoDB running).
- **Authentication Required:** You cannot test the Phase 2 APIs without first logging in (using the `/api/auth/login` endpoint) to get a valid JWT Token. This token must be included in the headers of all Phase 2 requests.

## 3. Data Sets (Database Schemas)
We created one new collection in our database for Phase 2:

1. **Lead (Potential Customer)**
   - **Purpose:** Stores the contact information and status of a potential sale.
   - **Fields:** Full Name (required), Phone Number (required), Email, Address (Country, State, City, Street, Pincode), Subject, Customer Interaction (e.g., "New Lead", "Contacted"), Date & Time, and an `is_deleted` flag.
   - **The Critical Field (`company_id`):** Every single Lead is permanently linked to a `Tenant`. This is what makes the CRM multi-tenant.
   - **Why it matters:** This is the core data that the business owners actually care about managing.

## 4. How the Code Flows (Architecture)
When an Admin wants to view their leads, the request follows this path:
1. **The Route (`leadRoutes`):** The server sees the URL path (e.g., `GET /api/leads`) and routes it.
2. **The Security Guard (`authMiddleware`):** Before anything happens, the guard intercepts the request, decrypts the user's Token, confirms they are an active 'Admin', and attaches their secret `company_id` to the request.
3. **The Controller (`leadController`):** The brain receives the request. Instead of just asking the database for "all leads", it explicitly asks the database for "all leads where the `company_id` matches this specific Admin, AND where `is_deleted` is false."
4. **The Database Model (`Lead`):** Mongoose fetches only the strictly filtered leads.
5. **The Response:** The Controller packages the leads up with pagination math (e.g., "Page 1 of 5") and sends it back to the user.

## 5. Total APIs Built (The Endpoints)

All of these endpoints require a valid JWT Token in the header, and the user MUST have the `Admin` role.

### The Leads CRUD Operations
- **`POST /api/leads` (Create Lead)**
  - **What it does:** Creates a new lead in the database. It ignores any `company_id` the user tries to send and instead forces the `company_id` extracted from their security token. It also triggers a (stubbed) notification system.
  - **Expected Input:** `full_name`, `phone_number` (plus optional email, address, etc.)
  - **Returns:** The newly created Lead data.

- **`GET /api/leads` (View All Leads)**
  - **What it does:** Fetches a list of leads belonging *only* to the user's company. It automatically filters out any leads marked as deleted. It supports pagination and searching.
  - **Expected Input (URL Queries):** `?page=1&limit=10&search=john`
  - **Returns:** A list of leads and pagination details (total leads, total pages, current page).

- **`GET /api/leads/:id` (View Single Lead)**
  - **What it does:** Fetches the specific details of one lead, verifying that the lead actually belongs to the user's company.
  - **Expected Input:** The Lead's ID in the URL.
  - **Returns:** The single Lead data.

- **`PUT /api/leads/:id` (Update Lead)**
  - **What it does:** Updates the details of an existing lead. It actively prevents a malicious user from trying to change the `company_id` of the lead to steal it.
  - **Expected Input:** The Lead's ID in the URL, and any fields to update in the Body (e.g., changing `customer_interaction` to "Contacted").
  - **Returns:** The updated Lead data.

- **`DELETE /api/leads/:id` (Soft Delete Lead)**
  - **What it does:** We do not permanently destroy data! This endpoint finds the lead and flips its `is_deleted` switch to `true`. Because the `GET` endpoints filter out deleted leads, it vanishes from the frontend UI but remains safe in the database.
  - **Expected Input:** The Lead's ID in the URL.
  - **Returns:** A success message.

---

## 6. Deep Dive: File Structure & Function Breakdown

Here is exactly what was added to the project structure in Phase 2, and what every function does.

### Structure Additions
```text
backend/
├── src/
│   ├── models/
│   │   └── Lead.js               # The Blueprint for a Lead
│   ├── routes/
│   │   └── leadRoutes.js         # The Traffic Cop for /api/leads
│   └── controllers/
│       └── leadController.js     # The Brain handling Lead logic
```

### Detailed File & Function Breakdown

#### `backend/src/models/Lead.js`
- **`leadSchema`**: A strict Mongoose blueprint. It demands that every Lead must have a `full_name`, `phone_number`, and most importantly, a `company_id` that references the `Tenant` collection. It also sets `is_deleted` to `false` by default.

#### `backend/src/routes/leadRoutes.js`
- **`router.use(requireAuth)`**: This instantly puts a security blanket over every single route in this file. 
- **`router.use(requireRole(['Admin']))`**: A secondary security blanket. Even if you are logged in, if you aren't an Admin, you are kicked out.
- **`router.route('/')`**: Directs `POST` traffic to `createLead` and `GET` traffic to `getLeads`.
- **`router.route('/:id')`**: Directs `GET`, `PUT`, and `DELETE` traffic for a specific ID to their respective controller functions.

#### `backend/src/controllers/leadController.js`
- **`triggerNotification()`**: A temporary "stub" function. Right now, it just prints a message to the terminal saying "Notification Sent". In Phase 7, we will replace this to actually send real in-app notifications.
- **`createLead()`**: Takes the incoming lead data, forces the `company_id` to be the one from the logged-in user's token (preventing hackers from assigning leads to other companies), saves it to the database, and calls the notification function.
- **`getLeads()`**: The most complex function here. It does three things:
  1. **Pagination:** It does math to figure out how many leads to skip based on what `page` the user asked for.
  2. **Security:** It builds a database query that strictly limits the search to the user's `company_id` and ignores deleted leads.
  3. **Search:** If the user typed something in the search bar, it tells the database to look for that text inside the Name, Phone, or Email fields (using `$regex` for partial matches).
- **`getLeadById()`**: A simple fetch. It looks for the ID in the URL, but *also* double-checks that the `company_id` matches the user. If a user guesses another company's Lead ID, it will return a 404 Not Found error!
- **`updateLead()`**: Takes the new data, actively deletes any `company_id` from the payload (so they can't change ownership), and tells the database to update the record.
- **`deleteLead()`**: Does NOT delete the lead! It uses `findOneAndUpdate` to simply change `is_deleted` to `true`.
