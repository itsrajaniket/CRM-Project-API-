# [Project Name] – Backend API Documentation

> Handoff doc for Frontend Team | Backend: MERN (MongoDB, Express, Node.js) | Author: [Your Name] | Last Updated: [Date]

---

## 1. Project Overview

- **Project Name:**
- **Short Description:** (1–2 lines about what the app does)
- **Backend Live/Base URL (Dev):** `http://localhost:5000/api`
- **Backend Live/Base URL (Prod/Staging):** `https://yourdomain.com/api`
- **Tech Stack:** Node.js, Express.js, MongoDB, Mongoose, JWT (or session-based auth)
- **Repo Link:** (GitHub link if applicable)
- **Postman Collection Link:** (link/file — see section 8)

---

## 2. How to Run Backend Locally (if frontend needs to run it)

```
1. Clone repo: git clone [link]
2. cd backend
3. npm install
4. Create .env file (see section 3)
5. npm run dev
6. Server runs on http://localhost:5000
```

---

## 3. Environment Variables (only non-secret ones shared)

| Variable | Example Value | Description |
|---|---|---|
| PORT | 5000 | Server port |
| BASE_URL | http://localhost:5000/api | API base path |
| CLIENT_URL | http://localhost:3000 | Frontend URL (for CORS) |

*(Do NOT share DB passwords, JWT secret keys, or third-party API secret keys here)*

---

## 4. Authentication Flow

- **Auth Type:** JWT (JSON Web Token) / Session-based *(pick whichever you used)*
- **Login endpoint returns:** access token (and refresh token if used)
- **How to send token:** In headers as:
  ```
  Authorization: Bearer <token>
  ```
- **Token Expiry:** e.g. Access token expires in 1 hour, Refresh token in 7 days
- **Where token comes from:** Response of `/api/auth/login`
- **Protected routes:** List which routes need this header (mark it per-endpoint below too)

---

## 5. Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "User fetched successfully",
  "data": { }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "code": 400
}
```

**Common Status Codes Used:**
| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 500 | Server Error |

---

## 6. Data Models (Simplified Schema Reference)

### User Model
| Field | Type | Required | Notes |
|---|---|---|---|
| _id | ObjectId | auto | |
| name | String | yes | |
| email | String | yes | unique |
| password | String | yes | hashed, never returned in response |
| role | String | yes | e.g. "user" / "admin" |
| createdAt | Date | auto | |

*(Repeat this table for every Model/Collection: Product, Order, Post, etc.)*

---

## 7. API Endpoints

> Group by feature/module. Repeat this exact block for every single endpoint.

### 🔹 Module: Authentication

#### 1. Register User
- **Method:** POST
- **URL:** `/api/auth/register`
- **Auth Required:** No
- **Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```
- **Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "64f...",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "eyJhbGciOi..."
  }
}
```
- **Error Response (400):**
```json
{ "success": false, "message": "Email already exists", "code": 400 }
```

#### 2. Login User
- **Method:** POST
- **URL:** `/api/auth/login`
- **Auth Required:** No
- **Request Body:**
```json
{ "email": "john@example.com", "password": "123456" }
```
- **Success Response (200):** *(same structure as above)*
- **Error Response (401):**
```json
{ "success": false, "message": "Invalid credentials", "code": 401 }
```

*(Continue this exact pattern for EVERY endpoint: Get Profile, Update Profile, Forgot Password, all CRUD routes for every module — Products, Orders, Cart, Posts, Comments, etc.)*

### 🔹 Module: [Next Feature — e.g. Products]

#### 1. Get All Products
- **Method:** GET
- **URL:** `/api/products`
- **Auth Required:** No
- **Query Params (if any):** `?page=1&limit=10&category=shoes`
- **Success Response (200):** ...

#### 2. Create Product
- **Method:** POST
- **URL:** `/api/products`
- **Auth Required:** Yes (Admin only)
- **Request Body:** ...
- **Success Response (201):** ...

*(and so on for every route in your route files)*

---

## 8. Postman Collection

- Export all routes as a Postman Collection JSON.
- Include example requests with real sample data for each route.
- Share as: `[ProjectName]_Postman_Collection.json`
- Frontend just imports it into Postman and can test every API instantly without asking you.

---

## 9. File/Image Upload Endpoints (if any)

- **Field name expected:** e.g. `image` (multipart/form-data)
- **Max file size:**
- **Allowed formats:**
- **Where uploaded file URL is returned:** e.g. `data.imageUrl`

---

## 10. Known Limitations / Pending Items

- List anything not finished yet, so frontend doesn't waste time debugging something incomplete.
- e.g. "Payment gateway integration not done", "Email OTP not connected yet"

---

## 11. Contact / Support

- **Backend Developer:** [Your Name]
- **Best way to reach for API issues:** [WhatsApp/Slack/Email]
- **Response time expectation:** (optional, sets boundary so people don't expect instant fixes)

