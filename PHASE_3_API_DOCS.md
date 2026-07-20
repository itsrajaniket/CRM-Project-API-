# Phase 3 (HR & Time-Tracking) – Backend API Documentation

> Handoff doc for Frontend Team | Backend: MERN (MongoDB, Express, Node.js) | Author: Backend Team (Aniket/AI) | Last Updated: 2026-07-20

---

## 1. Project Overview

- **Project Name:** Multi-Tenant CRM
- **Short Description:** The HR module allowing Admins to manage employees, and a self-service time-tracking engine for Telecallers to clock in and clock out.
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
- **Role Scoping:** This phase has strict role-based access control.
  - `/api/telecallers/...` -> Requires **Admin** Role
  - `/api/attendance/...` -> Requires **Telecaller** Role
  - `/api/breaks/...` -> Requires **Telecaller** Role
- **How to send token:** In headers as `Authorization: Bearer <token>`
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

### Attendance Model
| Field | Type | Required | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| user_id | ObjectId | yes | |
| company_id | ObjectId | yes | |
| date | Date | yes | Set exactly to midnight |
| shift_start_time | Date | yes | |
| shift_end_time | Date | no | |
| expected_minutes | Number | yes | Default 540 (9 hours) |
| net_work_minutes | Number | yes | Default 0 |
| status | String | yes | 'Active', 'Full Day', 'Half Day', 'Absent' |
| createdAt | Date | auto | |
| updatedAt | Date | auto | |

### Break Model
| Field | Type | Required | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| attendance_id | ObjectId | yes | References the daily Attendance record |
| user_id | ObjectId | yes | |
| company_id | ObjectId | yes | |
| break_type | String | yes | 'Lunch Break', 'Tea Break', 'Meeting', 'Training', 'Other - Personal' |
| reason | String | no | Required if break_type is 'Other - Personal' |
| start_time | Date | yes | |
| end_time | Date | no | |
| duration_minutes | Number | no | Calculated by backend |
| createdAt | Date | auto | |
| updatedAt | Date | auto | |

---

## 7. API Endpoints

### 🔹 Module: Admin (Telecaller Management)

#### 1. Create Telecaller
- **Method:** POST
- **URL:** `/api/telecallers`
- **Auth Required:** Yes (Admin)
- **Request Body:**
```json
{
  "full_name": "Jane Smith",
  "email": "jane@company.com",
  "phone": "555-1234",
  "password": "Password123!",
  "profile_image": "https://link-to-img.com"
}
```
- **Success Response (201):**
```json
{
  "success": true,
  "message": "Telecaller created successfully",
  "data": { "_id": "64h...", "full_name": "Jane Smith" }
}
```

#### 2. Get All Telecallers (Dashboard Table)
- **Method:** GET
- **URL:** `/api/telecallers`
- **Auth Required:** Yes (Admin)
- **Query Params (Optional):** `?page=1&limit=10&search=Jane&status=Active`
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Telecallers fetched successfully",
  "data": {
    "telecallers": [
      {
        "_id": "64h...",
        "full_name": "Jane Smith",
        "plain_password": "Password123!", 
        "status": "Active"
      }
    ],
    "pagination": { "total": 1, "page": 1, "pages": 1 }
  }
}
```

#### 3. Get Single Telecaller by ID
- **Method:** GET
- **URL:** `/api/telecallers/:id`
- **Auth Required:** Yes (Admin)
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Telecaller fetched successfully",
  "data": { "_id": "64h...", "full_name": "Jane Smith", "plain_password": "Password123!" }
}
```

#### 4. Update Telecaller
- **Method:** PUT
- **URL:** `/api/telecallers/:id`
- **Auth Required:** Yes (Admin)
- **Request Body:**
```json
{ "phone": "555-9999" }
```
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Telecaller updated successfully",
  "data": { "_id": "64h...", "phone": "555-9999" }
}
```

#### 5. Delete Telecaller (Soft Delete)
- **Method:** DELETE
- **URL:** `/api/telecallers/:id`
- **Auth Required:** Yes (Admin)
- **Success Response (200):**
```json
{ "success": true, "message": "Telecaller deleted successfully", "data": {} }
```

#### 6. Toggle Status
- **Method:** PATCH
- **URL:** `/api/telecallers/:id/status`
- **Auth Required:** Yes (Admin)
- **Request Body:**
```json
{ "status": "Inactive" }
```
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Status updated successfully",
  "data": { "_id": "64h...", "status": "Inactive" }
}
```

#### 7. Get Telecaller Attendance History
- **Method:** GET
- **URL:** `/api/telecallers/:id/attendance`
- **Auth Required:** Yes (Admin)
- **Query Params:** `?month=7&year=2026`
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Attendance fetched successfully",
  "data": { "records": [], "summary": {} }
}
```

#### 8. Get Telecaller Breaks (By Date)
- **Method:** GET
- **URL:** `/api/telecallers/:id/breaks`
- **Auth Required:** Yes (Admin)
- **Query Params:** `?date=2026-07-21`
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Breaks fetched successfully",
  "data": []
}
```

### 🔹 Module: Telecaller (Self-Service Attendance)

#### 1. Clock In (Start Day)
- **Method:** POST
- **URL:** `/api/attendance/clock-in`
- **Auth Required:** Yes (Telecaller)
- **Success Response (201):**
```json
{
  "success": true,
  "message": "Clock-in successful",
  "data": { "_id": "64i...", "status": "Active" }
}
```

#### 2. Get Today's Attendance State
- **Method:** GET
- **URL:** `/api/attendance/today`
- **Auth Required:** Yes (Telecaller)
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Current shift state fetched",
  "data": { "_id": "64i...", "status": "Active" }
}
```

#### 3. Get My Attendance History
- **Method:** GET
- **URL:** `/api/attendance/history`
- **Auth Required:** Yes (Telecaller)
- **Query Params:** `?month=7&year=2026`
- **Success Response (200):**
```json
{
  "success": true,
  "message": "History fetched successfully",
  "data": { "records": [], "summary": {} }
}
```

#### 4. Clock Out
- **Method:** PUT
- **URL:** `/api/attendance/clock-out`
- **Auth Required:** Yes (Telecaller)
- **Query Params:** `?confirm=false` or `?confirm=true`
- **How it works:** Call with `?confirm=false` first to get a preview. Once user confirms, call with `?confirm=true`.
- **Preview Response (`?confirm=false`):**
```json
{
  "success": true,
  "message": "Clock-out calculation preview",
  "data": { "status": "Half Day", "net_work_minutes": 270 }
}
```

### 🔹 Module: Telecaller (Self-Service Breaks)

#### 1. Start a Break
- **Method:** POST
- **URL:** `/api/breaks/start`
- **Auth Required:** Yes (Telecaller)
- **Request Body:**
```json
{
  "break_type": "Other - Personal",
  "reason": "Doctor appointment"
}
```
- **Success Response (201):**
```json
{
  "success": true,
  "message": "Break started successfully",
  "data": { "_id": "64j..." }
}
```

#### 2. Get Active Break
- **Method:** GET
- **URL:** `/api/breaks/active`
- **Auth Required:** Yes (Telecaller)
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Active break fetched",
  "data": { "_id": "64j...", "break_type": "Lunch Break" }
}
```

#### 3. End Active Break
- **Method:** PUT
- **URL:** `/api/breaks/:id/end`
- **Auth Required:** Yes (Telecaller)
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Break ended successfully",
  "data": { "_id": "64j...", "duration_minutes": 45 }
}
```

---

## 8. Postman Collection
- *Not generated yet for this phase.*

---

## 9. File/Image Upload Endpoints
- *No file uploads required for this phase.*

---

## 10. Known Limitations / Pending Items
- **Telecaller Status Display:** Ensure the frontend checks the `plain_password` field instead of `password` when rendering the telecaller tables.

---

## 11. Contact / Support
- **Backend Developer:** Aniket
