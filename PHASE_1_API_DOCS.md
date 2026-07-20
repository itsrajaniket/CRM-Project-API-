# Phase 1 (Auth & Onboarding) – Backend API Documentation

> Handoff doc for Frontend Team | Backend: MERN (MongoDB, Express, Node.js) | Author: Backend Team (Aniket/AI) | Last Updated: 2026-07-20

---

## 1. Project Overview

- **Project Name:** Multi-Tenant CRM
- **Short Description:** A multi-tenant CRM backend where companies can register, manage leads, and track telecaller attendance.
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
| OTP_EXPIRY_MINUTES | 10 | How long OTPs are valid for |

---

## 4. Authentication Flow

- **Auth Type:** JWT (JSON Web Token)
- **How to send token:** In headers as:
  ```
  Authorization: Bearer <token>
  ```
- **Where token comes from:** Response of `/api/auth/login` or `/api/auth/register`
- **Protected routes:** Indicated below (requires Authorization header).

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

**Common Status Codes Used:**
| Code | Meaning |
|---|---|
| 200 | OK (Success) |
| 201 | Created |
| 400 | Bad Request (Validation or logic error) |
| 401 | Unauthorized (No token or invalid token) |
| 404 | Not Found |
| 500 | Server Error |

---

## 6. Data Models (Simplified Schema Reference)

### User Model
| Field | Type | Required | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| company_id | ObjectId | yes | References Tenant |
| role | String | yes | 'SuperAdmin', 'Admin', 'Telecaller', 'SATelecaller' |
| full_name | String | yes | |
| email | String | yes | unique |
| password | String | yes | hashed, never returned in response |
| plain_password | String | no | Stored for UI display purposes |
| phone | String | no | |
| profile_image | String | no | |
| status | String | yes | 'Active' or 'Inactive' (Default: 'Active') |
| is_deleted | Boolean | yes | Default: false |
| created_at | Date | auto | |

### Tenant Model (Company)
| Field | Type | Required | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| business_name | String | yes | |
| business_email | String | yes | |
| logo_url | String | no | |
| team_size | String | no | |
| website | String | no | |
| business_phone | String | no | |
| gst_number | String | no | |
| subscription_plan_id | ObjectId | no | References SubscriptionPlan |
| status | String | yes | 'Active' or 'Inactive' (Default: 'Active') |
| is_platform_tenant | Boolean | yes | Default: false (true for SuperAdmin) |
| created_at | Date | auto | |

### Otp Model
| Field | Type | Required | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| user_id | ObjectId | yes | References User |
| code | String | yes | 6-digit OTP code |
| expires_at | Date | yes | Expiration timestamp |
| used | Boolean | yes | Default: false |
| created_at | Date | auto | |

---

## 7. API Endpoints

### 🔹 Module: Authentication & Onboarding

#### 1. Register User (Admin)
- **Method:** POST
- **URL:** `/api/auth/register`
- **Auth Required:** No
- **Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@company.com",
  "phone": "1234567890",
  "password": "securepassword123"
}
```
- **Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please complete business setup.",
  "data": {
    "user_id": "64f...",
    "token": "eyJhbG...",
    "business_setup_complete": false
  }
}
```

#### 2. Business Setup
- **Method:** POST
- **URL:** `/api/auth/business-setup`
- **Auth Required:** Yes (Use Token from Register step)
- **Request Body:**
```json
{
  "business_name": "Tech Corp",
  "logo_url": "https://example.com/logo.png",
  "team_size": "10-50",
  "website": "www.techcorp.com",
  "business_email": "hello@techcorp.com",
  "business_phone": "9876543210",
  "gst_number": "GST123456"
}
```
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Business setup completed successfully",
  "data": { "company_id": "64f..." }
}
```

#### 3. Login User (CRM User & Telecaller)
- **Method:** POST
- **URL:** `/api/auth/login`
- **Auth Required:** No
- **Request Body:**
```json
{ "email": "john@company.com", "password": "securepassword123" }
```
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbG...",
    "user": { "id": "64f...", "role": "Admin", "business_setup_complete": true }
  }
}
```

#### 4. Login User (Super Admin)
- **Method:** POST
- **URL:** `/api/admin/auth/login`
- **Auth Required:** No
- **Request Body:**
```json
{ "email": "superadmin@crm.com", "password": "securepassword123" }
```
- **Success Response (200):** *(Returns same structure as CRM User login)*

#### 5. Login User (Super Admin Telecaller)
- **Method:** POST
- **URL:** `/api/sa-telecaller/auth/login`
- **Auth Required:** No
- **Request Body:**
```json
{ "email": "satelecaller@crm.com", "password": "securepassword123" }
```
- **Success Response (200):** *(Returns same structure as CRM User login)*

#### 6. Forgot Password (Generate OTP)
- **Method:** POST
- **URL:** `/api/auth/forgot-password`
- **Auth Required:** No
- **Request Body:**
```json
{ "email": "john@company.com" }
```
- **Success Response (200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, an OTP has been sent.",
  "data": { "dev_otp": "950001" } 
}
```

#### 7. Verify OTP
- **Method:** POST
- **URL:** `/api/auth/verify-otp`
- **Auth Required:** No
- **Request Body:**
```json
{ "email": "john@company.com", "otp": "950001" }
```
- **Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": { "otp_reset_token": "eyJhbG..." }
}
```

#### 8. Reset Password
- **Method:** POST
- **URL:** `/api/auth/reset-password`
- **Auth Required:** No (But requires `otp_reset_token` in body)
- **Request Body:**
```json
{ 
  "email": "john@company.com",
  "otp_reset_token": "eyJhbG...",
  "new_password": "newpassword123",
  "confirm_password": "newpassword123"
}
```
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {}
}
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
- **Email Delivery:** OTPs are currently printed to the server terminal (`dev_otp`) instead of sending a real email.

---

## 11. Contact / Support
- **Backend Developer:** Aniket
