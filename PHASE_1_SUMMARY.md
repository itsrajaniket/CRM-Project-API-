# Phase 1 Summary: Setup & Authentication

This document provides a deep, comprehensive breakdown of everything built in **Phase 1** of our CRM API project. It explains the architecture, the flow of data, the database models used, and the APIs created, without diving into raw code.

## 1. What We Did in This Phase
In Phase 1, we established the core foundation of our backend server and built a complete, secure Authentication Engine. We designed a **Multi-Tenant System**, which means that one single backend can securely host many different businesses without their data ever getting mixed up. We also implemented standard security practices to log users in, protect routes, and reset forgotten passwords.

## 2. Prerequisites: What is Required to Run It?
To run this API backend, the following pieces are required in your environment:
- **Node.js**: The runtime environment that executes the server.
- **MongoDB**: A running MongoDB database (either local or cloud-based via MongoDB Atlas) to store our records.
- **Environment Variables (`.env` file)**:
  - `PORT`: The port number the server runs on (e.g., 5000).
  - `MONGO_URI`: The connection string telling our server how to reach the MongoDB database.
  - `JWT_SECRET`: A secret cryptographic key used to sign and verify our digital wristbands (Tokens).

## 3. Data Sets (Database Schemas)
We created three main collections (tables) in our database to support Phase 1:

1. **Tenant (Company)**
   - **Purpose:** Represents a business that subscribes to our CRM. 
   - **Fields:** Business Name, Registration Number, GST Number, Tax ID, Address (Country, State, City, Pincode), and a Subscription Status.
   - **Why it matters:** Every single piece of data generated in the future (leads, history, etc.) will be permanently tied to a Tenant.

2. **User (Employees & Admins)**
   - **Purpose:** Represents the actual humans logging into the system.
   - **Fields:** Full Name, Email, Password (securely hashed), Phone Number, Role (SuperAdmin, Admin, Telecaller, or SATelecaller), and a link to the `Tenant` they work for.
   - **Why it matters:** It keeps track of who is doing what and restricts their permissions based on their `Role`.

3. **OTP (One-Time Password)**
   - **Purpose:** Temporarily holds 6-digit codes used for password resets.
   - **Fields:** Email, OTP Code, and an Expiration Time (which automatically deletes the OTP from the database after 10 minutes).
   - **Why it matters:** It acts as a secure, temporary lock to prove a user's identity before they can change their password.

## 4. How the Code Flows (Architecture)
When a request comes from the frontend (like a user clicking "Login"), it follows a very specific path:
1. **The Route (`authRoutes`):** The server sees the URL path (e.g., `/api/auth/login`) and routes it to the correct controller.
2. **The Middleware (`authMiddleware`):** If a route is protected (like Business Setup), it first hits our security checkpoint. The middleware checks if the user has a valid "JWT Token". If they do, it extracts their unique ID and Company ID and passes them forward. If not, it rejects the request instantly.
3. **The Controller (`authController`):** This is the brain. It takes the data (like email and password), talks to the Database to verify it, generates a response (like success or error), and sends that JSON response back to the frontend.
4. **The Database Model (`models`):** The controller uses our Mongoose Models to fetch or save data safely.
5. **The Error Handler:** If anything crashes at any point, a global safety net catches it and sends a polite error message back to the user so the server doesn't shut down.

## 5. Total APIs Built (The Endpoints)

Here is a complete list of the APIs built in Phase 1, what data they expect, and what they do:

### Registration & Setup
- **`POST /api/auth/register`**
  - **What it does:** Creates a brand-new Admin user and instantly generates a "Pending Setup" Tenant for them. It hashes their password before saving it.
  - **Expected Input:** Full Name, Email, Password, Phone Number.
  - **Returns:** A JWT Token so they are instantly logged in.

- **`POST /api/auth/business-setup`** *(Protected Route)*
  - **What it does:** Allows a newly registered user to fill out their actual company details. It updates the temporary "Pending Setup" Tenant with real information.
  - **Expected Input:** Business Name, Registration No, GST No, Tax ID, Country, State, City, Pincode.
  - **Returns:** A success confirmation and the updated Tenant details.

### Login Flows
- **`POST /api/auth/login`**
  - **What it does:** The standard login for CRM Users (Admins) and Telecallers. It verifies their email and hashed password.
  - **Expected Input:** Email, Password.
  - **Returns:** A secure JWT Token containing their User ID, Role, and Company ID.

- **`POST /api/auth/admin/login`**
  - **What it does:** Dedicated login strictly for the `SuperAdmin` role. If a regular user tries to use this, they are rejected.
  - **Expected Input:** Email, Password.
  - **Returns:** A secure JWT Token.

- **`POST /api/auth/sa-telecaller/login`**
  - **What it does:** Dedicated login strictly for the `SATelecaller` (Super Admin Telecaller) role.
  - **Expected Input:** Email, Password.
  - **Returns:** A secure JWT Token.

### Password Reset Flow
- **`POST /api/auth/forgot-password`**
  - **What it does:** Checks if an email exists in the system. If it does, it generates a random 6-digit OTP, saves it in the database, and prints it to the console (simulating sending an email).
  - **Expected Input:** Email.
  - **Returns:** A success message that an OTP has been generated.

- **`POST /api/auth/verify-otp`**
  - **What it does:** Checks the database to see if the OTP provided matches the one generated for that email.
  - **Expected Input:** Email, OTP Code.
  - **Returns:** A success message if they match, allowing them to proceed to resetting the password.

- **`POST /api/auth/reset-password`**
  - **What it does:** Updates the user's password with a newly provided one. It hashes the new password before storing it securely.
  - **Expected Input:** Email, New Password.
  - **Returns:** A success message confirming the password change.

---

## 6. Deep Dive: File Structure & Function Breakdown

To understand exactly how the project is organized under the hood, here is the complete file structure built in Phase 1 and an explanation of every function within them.

### Structure Overview
```text
backend/
├── server.js                   # The main entry point of the server
├── package.json                # List of all installed tools (express, mongoose, etc.)
└── src/
    ├── config/
    │   └── db.js               # Database connection logic
    ├── models/
    │   ├── Tenant.js           # Database Schema for Companies
    │   ├── User.js             # Database Schema for Users/Employees
    │   └── Otp.js              # Database Schema for Password Reset Codes
    ├── routes/
    │   └── authRoutes.js       # URL definitions for authentication
    ├── controllers/
    │   └── authController.js   # The core logic and brain of authentication
    ├── middleware/
    │   ├── authMiddleware.js   # Security checks (JWT verification)
    │   └── errorMiddleware.js  # Global crash prevention
    └── utils/
        └── response.js         # Standardization for JSON responses
```

### Detailed File & Function Breakdown

#### `backend/server.js`
This is the heart of the application. It boots up the Express web server, connects to the database, applies global configurations (like allowing Cross-Origin Requests with `cors`), and mounts our `authRoutes` onto the `/api/auth` path. Finally, it tells the server to "listen" on Port 5000.

#### `backend/src/config/db.js`
- **`connectDB()`**: An asynchronous function that attempts to connect to MongoDB using the `MONGO_URI` from the `.env` file. If it fails, it shuts down the server to prevent running in a broken state.

#### `backend/src/utils/response.js`
- **`sendSuccess(res, data, message, statusCode)`**: A helper function ensuring that every successful API response has the exact same structure (`{ success: true, data: ..., message: ... }`).
- **`sendError(res, message, statusCode)`**: A helper function ensuring that every failed API response is identically structured (`{ success: false, data: null, message: ... }`).

#### `backend/src/middleware/authMiddleware.js`
- **`requireAuth()`**: This function runs *before* protected routes. It checks the request headers for a `Bearer` token. If found, it decrypts the token using `JWT_SECRET`. It then checks if the user still exists in the database and isn't deleted or inactive. If all checks pass, it attaches the user's details (`id`, `role`, `company_id`) to the request so the controller can use them.
- **`requireRole(roles)`**: This function is used to restrict routes to specific user types (e.g., `Admin` only). It checks if the `req.user.role` matches the allowed roles.

#### `backend/src/middleware/errorMiddleware.js`
- **`errorHandler()`**: A global safety net. If any function in the app crashes or throws an unexpected error, Express will pass it here. This function formats the crash into a clean `sendError` JSON response, ensuring the frontend never sees a raw HTML stack trace.

#### `backend/src/controllers/authController.js`
*This file contains the actual business logic for the APIs.*
- **`generateToken(user)`**: An internal helper that creates a secure, encrypted JWT token containing the user's ID, role, and company ID.
- **`register(req, res)`**: Checks if the email is already in use. Creates a "Pending Setup" Tenant. Hashes the incoming password. Creates a new User attached to that Tenant. Returns a success message and token.
- **`businessSetup(req, res)`**: Takes data from the frontend and updates the "Pending Setup" Tenant with real company details. Marks the Tenant as 'Active'.
- **`loginCore(req, res, expectedRole)`**: The internal logic engine for all logins. It checks if the user exists, verifies the hashed password, ensures the account is active, and verifies that the user is trying to log into the correct portal (e.g., stopping an Admin from logging into the SuperAdmin portal).
- **`login(req, res)`**, **`superAdminLogin(req, res)`**, **`saTelecallerLogin(req, res)`**: These are thin wrapper functions that simply call `loginCore` and pass it the specific role required for that login page.
- **`forgotPassword(req, res)`**: Searches for the user by email. If found, generates a random 6-digit number, saves it in the `Otp` database collection, and (currently) prints it to the developer console.
- **`verifyOtp(req, res)`**: Checks if the provided OTP matches the one in the database and hasn't expired. If valid, marks it as used and issues a temporary 15-minute "reset token".
- **`resetPassword(req, res)`**: Verifies the 15-minute reset token, ensures the new passwords match, hashes the new password, and saves it to the User's database profile.

#### `backend/src/routes/authRoutes.js`
This file acts as a map. It links the URL paths (like `POST /register`) to the exact functions inside `authController.js`. It also applies the `requireAuth` middleware to the `/business-setup` route to protect it.
