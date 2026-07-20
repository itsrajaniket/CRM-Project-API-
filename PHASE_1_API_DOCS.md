# Phase 1 (Auth & Onboarding) – Backend API Documentation

> Handoff doc for Frontend Team | Backend: MERN (MongoDB, Express, Node.js) | Phase: 1

---

## 1. Project Overview

- **Project Name:** Multi-Tenant CRM
- **Short Description:** A multi-tenant CRM backend where companies can register, manage leads, and track telecaller attendance.
- **Backend Live/Base URL (Dev):** `http://localhost:5000/api`
- **Tech Stack:** Node.js, Express.js, MongoDB, Mongoose, JWT Auth

---

## 2. Authentication Flow

- **Auth Type:** JWT (JSON Web Token)
- **How to send token:** In headers as:
  ```
  Authorization: Bearer <token>
  ```
- **Where token comes from:** Response of `/api/auth/login` or `/api/auth/register`
- **Protected routes:** Indicated below (requires Authorization header).

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

## 4. Data Models (Simplified Schema Reference)

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
| status | String | yes | 'Active' or 'Inactive' |
| is_deleted | Boolean | yes | defaults to false |

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
| status | String | yes | 'Active' or 'Inactive' |

---

## 5. API Endpoints

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
- **Error Response (400):**
```json
{ "success": false, "message": "User with this email already exists", "data": null }
```

#### 2. Business Setup
- **Method:** POST
- **URL:** `/api/auth/business-setup`
- **Auth Required:** Yes (Use Token from Register step)
- **Request Body:**
```json
{
  "business_name": "Tech Corp",
  "logo_url": "https://link-to-image.com",
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
  "data": {
    "company_id": "64f..."
  }
}
```

#### 3. Login User (CRM User & Telecaller)
- **Method:** POST
- **URL:** `/api/auth/login`
- **Auth Required:** No
- **Request Body:**
```json
{ 
  "email": "john@company.com", 
  "password": "securepassword123" 
}
```
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbG...",
    "user": {
      "id": "64f...",
      "full_name": "John Doe",
      "email": "john@company.com",
      "role": "Admin",
      "company_id": "64f...",
      "business_setup_complete": true
    }
  }
}
```
- **Error Response (401):**
```json
{ "success": false, "message": "Invalid email or password", "data": null }
```
*(Note: There are alternative login routes for Super Admin (`/api/admin/auth/login`) and SA Telecallers (`/api/sa-telecaller/auth/login`) using the exact same body/response structure).*

#### 4. Forgot Password (Generate OTP)
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
*(Note: `dev_otp` is currently returned in the payload for testing purposes. In production, this will be removed and sent via email).*

#### 5. Verify OTP
- **Method:** POST
- **URL:** `/api/auth/verify-otp`
- **Auth Required:** No
- **Request Body:**
```json
{ 
  "email": "john@company.com",
  "otp": "950001"
}
```
- **Success Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "otp_reset_token": "eyJhbG..."
  }
}
```
*(Note: You must save this `otp_reset_token`, as it is required for the final reset password step).*

#### 6. Reset Password
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
