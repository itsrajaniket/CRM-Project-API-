# CRM API Backend — Learning Guide

Welcome! Since you are building a backend API for the first time, this document will serve as your personal guide. As we build each phase of the project, I will update this file to explain **what** we are doing, **why** we are doing it, and **how** the code works.

---

## What is a REST API?
An API (Application Programming Interface) is like a waiter in a restaurant. 
- The **Frontend** (React/Figma designs) is the customer looking at the menu.
- The **Database** (MongoDB) is the kitchen where all the ingredients (data) are stored.
- The **Backend API** (what we are building) is the waiter who takes the order from the customer, goes to the kitchen to get the food, and brings it back to the customer.

We are building the "waiter". The frontend will ask us for data (e.g., "Give me all the leads"), and we will fetch it from the database and send it back as JSON (a simple text format).

---

## Our Technology Stack
- **Node.js**: The environment that runs our JavaScript code on the server.
- **Express.js**: A framework for Node.js that makes it very easy to create API routes (like `/api/auth/login`).
- **MongoDB**: Our database. It stores data in flexible, JSON-like documents.
- **Mongoose**: A tool that helps our Node.js code talk to MongoDB easily. It allows us to define "Schemas" (rules for what data a User or Lead should have).

---

## Phase 1: Setup & Authentication (Coming Next)

### What We Just Built (Phase 1 Completed!)

We have successfully built the Authentication and Onboarding engine for your CRM! Here is exactly what we created inside the new `backend` folder:

1. **Project Setup (`server.js`)**: 
   - We created a `server.js` file. This is the main engine of our API. It listens for incoming requests (like logins) on port 5000. 
   - We installed `express` (to handle the web traffic) and `mongoose` (to talk to MongoDB).
   - We set up a global Error Handler. This ensures that if the server breaks, the frontend gets a clean `{ success: false, message: "..." }` response instead of crashing the whole server.

2. **Database Models (`src/models/`)**: 
   - We created the `Tenant` model. This represents a Company. Because this is a *Multi-Tenant* CRM, every user and lead will belong to a specific Tenant.
   - We created the `User` model. This holds the employee's details, role (`SuperAdmin`, `Admin`, `Telecaller`), and their password.
   - We created an `Otp` model. This temporarily stores the 6-digit codes generated when someone clicks "Forgot Password".

3. **Security Measures (`src/middleware/authMiddleware.js`)**: 
   - We created a lock on our API called `requireAuth`. When a user logs in, they get a "JWT" (JSON Web Token) which acts like a VIP wristband.
   - Every time the frontend asks for secure data, it sends the JWT. `requireAuth` checks the wristband. If it's valid, it figures out exactly which `company_id` the user belongs to and attaches it to the request so they can never see another company's data.

4. **Controllers & Logic (`src/controllers/authController.js`)**:
   - **`/register`**: Creates an `Admin` user and a dummy Tenant named "Pending Setup".
   - **`/business-setup`**: Takes the logged-in user and fully fills out their Tenant details (Business Name, GST, etc.).
   - **`/login`**: Checks the email, securely compares the hashed password using `bcrypt`, and returns the JWT wristband. It also ensures SuperAdmins can only log in through the SuperAdmin portal.
   - **`/forgot-password` & `/verify-otp`**: Generates a random 6-digit code, saves it to the database, and later verifies if the user entered it correctly. For now, it prints the OTP to our server console!

### What's Next?
In **Phase 2**, we will start building the "Client & Lead Engine" so you can actually start adding and viewing customer leads!
