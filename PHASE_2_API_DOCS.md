# Phase 2 (Leads Management) – Backend API Documentation

> Handoff doc for Frontend Team | Backend: MERN (MongoDB, Express, Node.js) | Author: Backend Team (Aniket/AI) | Last Updated: 2026-07-20

---

## 1. Project Overview

- **Project Name:** Multi-Tenant CRM
- **Short Description:** The core Leads Engine allowing CRM Admins to create, view, update, and soft-delete potential customers.
- **Backend Live/Base URL (Dev):** `http://localhost:5000/api`
- **Backend Live/Base URL (Prod/Staging):** `N/A (Local Dev Only for now)`
- **Tech Stack:** Node.js, Express.js, MongoDB, Mongoose, JWT Auth
- **Repo Link:** `N/A (Pending)`
- **Postman Collection Link:** `N/A (Pending)`

---

## 2. How to Run Backend Locally

```bash
1. cd backend
2. npm install
3. node server.js
4. Server runs on http://localhost:5000
```

---

## 3. Environment Variables (Non-secret only)

| Variable | Example Value | Description |
|---|---|---|
| PORT | 5000 | Server port |
| MONGO_URI | mongodb://localhost:27017/crm | Database connection string |

---

## 4. Authentication Flow

- **Auth Type:** JWT (JSON Web Token)
- **Role Required:** **Admin** (Telecallers are blocked from these endpoints)
- **How to send token:** In headers as:
  ```
  Authorization: Bearer <token>
  ```
- **Protected routes:** ALL routes in this document require the Authorization header.

---

## 5. Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Dynamic success message",
  "data": { }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

---

## 6. Data Models (Simplified Schema Reference)

### Lead Model
| Field | Type | Required | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| company_id | ObjectId | yes | Handled automatically by backend (Tenant Isolation) |
| full_name | String | yes | |
| phone_number | String | yes | |
| email_id | String | no | |
| country | String | no | |
| state | String | no | |
| city | String | no | |
| street | String | no | |
| pincode | String | no | |
| customer_interaction | String | no | e.g., "New Lead", "Contacted", "Interested" |
| date_time | Date | no | For scheduling interactions |
| subject | String | no | |
| is_deleted | Boolean | yes | Defaults to false (Soft delete logic) |
| createdAt | Date | auto | Provided by Mongoose timestamps |
| updatedAt | Date | auto | Provided by Mongoose timestamps |

---

## 7. API Endpoints

### 🔹 Module: Leads (CRUD)

#### 1. Create a Lead
- **Method:** POST
- **URL:** `/api/leads`
- **Auth Required:** Yes (Admin)
- **Request Body:**
```json
{
  "full_name": "Sarah Smith",
  "phone_number": "555-0199",
  "email_id": "sarah@example.com",
  "country": "USA",
  "state": "New York",
  "city": "Manhattan",
  "street": "123 Broadway",
  "pincode": "10001",
  "customer_interaction": "New Lead",
  "subject": "Inquiry about CRM",
  "date_time": "2026-07-21T10:00:00.000Z"
}
```
*(Note: Do NOT send `company_id`. The backend extracts it from the JWT Token).*
- **Success Response (201):**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": { 
    "_id": "64g...", 
    "full_name": "Sarah Smith",
    "createdAt": "2026-07-20T..."
  }
}
```

#### 2. Get All Leads (With Search & Pagination)
- **Method:** GET
- **URL:** `/api/leads`
- **Auth Required:** Yes (Admin)
- **Query Params (Optional):** `?page=1&limit=10&search=Sarah`
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Leads fetched successfully",
  "data": {
    "leads": [ 
      { 
        "_id": "64g...", 
        "full_name": "Sarah Smith",
        "phone_number": "555-0199",
        "email_id": "sarah@example.com"
      } 
    ],
    "pagination": { "total": 1, "page": 1, "pages": 1 }
  }
}
```

#### 3. Get Single Lead by ID
- **Method:** GET
- **URL:** `/api/leads/:id`
- **Auth Required:** Yes (Admin)
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Lead fetched successfully",
  "data": { 
    "_id": "64g...", 
    "full_name": "Sarah Smith",
    "phone_number": "555-0199"
  }
}
```

#### 4. Update a Lead
- **Method:** PUT
- **URL:** `/api/leads/:id`
- **Auth Required:** Yes (Admin)
- **Request Body:**
```json
{ "customer_interaction": "Contacted" }
```
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Lead updated successfully",
  "data": { "_id": "64g...", "customer_interaction": "Contacted" }
}
```

#### 5. Delete a Lead (Soft Delete)
- **Method:** DELETE
- **URL:** `/api/leads/:id`
- **Auth Required:** Yes (Admin)
- **Success Response (200):**
```json
{ "success": true, "message": "Lead deleted successfully", "data": {} }
```

---

## 8. Postman Collection
- **File:** `CRM_Postman_Collection.json` (Located in the root desktop folder).
- **Usage:** Import this file into Postman to instantly access all 28 APIs built in Phases 1, 2, and 3. No manual configuration required.

---

## 9. File/Image Upload Endpoints
- *No file uploads required for this phase.*

---

## 10. Known Limitations / Pending Items
- **Notifications:** When a lead is created, the system currently only prints a notification to the server console (`[NOTIFICATION STUB]`). Real in-app notifications will be built in Phase 7.

---

## 11. Contact / Support
- **Backend Developer:** Aniket
