# Phase 3 (HR & Time-Tracking) – Backend API Documentation

> Handoff doc for Frontend Team | Backend: MERN (MongoDB, Express, Node.js) | Phase: 3

---

## 1. Project Overview

- **Project Name:** Multi-Tenant CRM
- **Short Description:** The HR module allowing Admins to manage employees (Telecallers), and a self-service time-tracking engine for Telecallers to clock in, take breaks, and clock out (with automated math grading).
- **Backend Live/Base URL (Dev):** `http://localhost:5000/api`
- **Tech Stack:** Node.js, Express.js, MongoDB, Mongoose, JWT Auth

---

## 2. Authentication Flow

- **Auth Type:** JWT (JSON Web Token)
- **Role Scoping:** This phase has strict role-based access control.
  - `/api/telecallers/...` -> Requires **Admin** Role
  - `/api/attendance/...` -> Requires **Telecaller** Role
  - `/api/breaks/...` -> Requires **Telecaller** Role
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

## 4. API Endpoints: Admin (Telecaller Management)

> **Important UI Note:** The Figma design requires Admins to see their employees' passwords in plain text on the dashboard. To support this safely, when creating a Telecaller, the backend hashes the `password` for secure login, but stores a raw copy in `plain_password`. The GET endpoints return this `plain_password` specifically for the UI.

### 1. Create Telecaller
- **Method:** POST
- **URL:** `/api/telecallers`
- **Auth Required:** Yes (Admin)
- **Request Body:**
```json
{
  "full_name": "Jane Smith",
  "email": "jane@company.com",
  "phone": "555-1234",
  "password": "Password123!"
}
```
- **Success Response (201):**
```json
{
  "success": true,
  "message": "Telecaller created successfully",
  "data": {
    "_id": "64h...",
    "full_name": "Jane Smith",
    "plain_password": "Password123!" 
  }
}
```

### 2. Get All Telecallers (Dashboard Table)
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
        "email": "jane@company.com",
        "plain_password": "Password123!", 
        "status": "Active"
      }
    ],
    "pagination": { "total": 1, "page": 1, "pages": 1 }
  }
}
```

### 3. Toggle Status (Active / Inactive)
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
  "data": { "status": "Inactive" }
}
```

### 4. Fetch Telecaller Attendance History
- **Method:** GET
- **URL:** `/api/telecallers/:id/attendance`
- **Auth Required:** Yes (Admin)
- **Query Params:** `?month=7&year=2026`
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Attendance fetched successfully",
  "data": {
    "records": [ ... ],
    "summary": {
      "total_days": 20,
      "full_day": 18,
      "half_day": 2,
      "absent": 0
    }
  }
}
```

---

## 5. API Endpoints: Telecaller (Self-Service Attendance)

> **Role Note:** You must use a Telecaller's JWT token to test these endpoints.

### 1. Clock In (Start Day)
- **Method:** POST
- **URL:** `/api/attendance/clock-in`
- **Auth Required:** Yes (Telecaller)
- **Request Body:** (Empty)
- **Success Response (201):**
```json
{
  "success": true,
  "message": "Clock-in successful",
  "data": {
    "_id": "64i...",
    "shift_start_time": "2026-07-20T09:00:00.000Z",
    "status": "Active"
  }
}
```
*(Note: Returns 400 error if they are already clocked in for the day).*

### 2. Start a Break
- **Method:** POST
- **URL:** `/api/breaks/start`
- **Auth Required:** Yes (Telecaller)
- **Request Body:**
```json
{
  "break_type": "Lunch Break" 
}
```
*(Valid Break Types: 'Lunch Break', 'Tea Break', 'Meeting', 'Training', 'Other - Personal'. Note: If 'Other - Personal' is selected, a `"reason"` string must also be included in the body).*

### 3. End Active Break
- **Method:** PUT
- **URL:** `/api/breaks/:id/end`
- **Auth Required:** Yes (Telecaller)
- **Request Body:** (Empty)
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Break ended successfully",
  "data": {
    "duration_minutes": 45
  }
}
```

### 4. Clock Out (The Math Engine)
- **Method:** PUT
- **URL:** `/api/attendance/clock-out`
- **Auth Required:** Yes (Telecaller)
- **Query Params:** `?confirm=false` or `?confirm=true`
- **How it works:** 
  - Call with `?confirm=false` first. The backend will calculate the net work time and return a status (`full_day`, `half_day`, or `very_early`), but it will **not** save anything to the database. You use this to show a warning modal on the frontend (e.g., "Are you sure? You are clocking out very early!").
  - Once the user confirms, call the exact same endpoint with `?confirm=true` to permanently save the timecard.
- **Preview Response (`?confirm=false`):**
```json
{
  "success": true,
  "message": "Clock-out calculation preview",
  "data": {
    "status": "Half Day",
    "alert_type": "half_day",
    "net_work_minutes": 270
  }
}
```
