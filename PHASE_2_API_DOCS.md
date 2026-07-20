# Phase 2 (Leads Management) – Backend API Documentation

> Handoff doc for Frontend Team | Backend: MERN (MongoDB, Express, Node.js) | Phase: 2

---

## 1. Project Overview

- **Project Name:** Multi-Tenant CRM
- **Short Description:** The core Leads Engine allowing CRM Admins to create, view, update, and soft-delete potential customers.
- **Backend Live/Base URL (Dev):** `http://localhost:5000/api`
- **Tech Stack:** Node.js, Express.js, MongoDB, Mongoose, JWT Auth

---

## 2. Authentication Flow

- **Auth Type:** JWT (JSON Web Token)
- **Role Required:** **Admin** (Telecallers are blocked from these specific endpoints)
- **How to send token:** In headers as:
  ```
  Authorization: Bearer <token>
  ```
- **Protected routes:** ALL routes in this document require the Authorization header.

---

## 3. Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Dynamic success message",
  "data": { ... }
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

## 4. Data Models (Simplified Schema Reference)

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
| customer_interaction | String | no | e.g., "New Lead", "Contacted" |
| subject | String | no | |
| date_time | Date | no | |
| is_deleted | Boolean | yes | Defaults to false (Soft delete logic) |

---

## 5. API Endpoints

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
  "customer_interaction": "New Lead",
  "city": "New York"
}
```
*(Note: The Frontend does NOT need to send `company_id`. The backend automatically extracts it from the JWT Token).*

- **Success Response (201):**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "_id": "64g...",
    "full_name": "Sarah Smith",
    "phone_number": "555-0199",
    "company_id": "64f..."
  }
}
```

#### 2. Get All Leads (With Search & Pagination)
- **Method:** GET
- **URL:** `/api/leads`
- **Auth Required:** Yes (Admin)
- **Query Params (Optional):** 
  - `?page=1` (Defaults to 1)
  - `?limit=10` (Defaults to 10)
  - `?search=Sarah` (Searches across `full_name`, `phone_number`, and `email_id`)
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
        "phone_number": "555-0199"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "pages": 1
    }
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
    "phone_number": "555-0199",
    "email_id": "sarah@example.com"
  }
}
```
- **Error Response (404):**
```json
{ "success": false, "message": "Lead not found", "data": null }
```

#### 4. Update a Lead
- **Method:** PUT
- **URL:** `/api/leads/:id`
- **Auth Required:** Yes (Admin)
- **Request Body:** *(Send only the fields you want to update)*
```json
{
  "customer_interaction": "Contacted",
  "email_id": "sarah.smith@newdomain.com"
}
```
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Lead updated successfully",
  "data": {
    "_id": "64g...",
    "full_name": "Sarah Smith",
    "customer_interaction": "Contacted",
    "email_id": "sarah.smith@newdomain.com"
  }
}
```

#### 5. Delete a Lead (Soft Delete)
- **Method:** DELETE
- **URL:** `/api/leads/:id`
- **Auth Required:** Yes (Admin)
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Lead deleted successfully",
  "data": {}
}
```
*(Note: This performs a Soft Delete in the database by setting `is_deleted: true`. The lead will no longer appear in the GET requests, but remains safe in the database).*
