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

## Phase 1: Setup & Authentication (Completed)
We have successfully built the Authentication and Onboarding engine for your CRM! We created a Multi-Tenant system that securely logs users in and keeps company data completely separate.

👉 **For a deep dive into exactly how Phase 1 works, including the code flow and API list, please read the [PHASE_1_SUMMARY.md](file:///c:/Users/ANIKET/Desktop/NEW%20CRM/PHASE_1_SUMMARY.md) file.**

---

## Phase 2: Leads Management (Completed)
We have built the core engine that allows CRM Users to manage their potential customers! 

### What is a Lead?
In a CRM (Customer Relationship Management) system, a "Lead" is a person or business that has shown interest in your product but hasn't bought it yet. Our backend now allows users to:
- **Create** new leads and save their contact info to the database.
- **Read** (View) a list of all their leads, with built-in search and pagination (so we don't send 10,000 leads to the frontend all at once).
- **Update** lead information.
- **Delete** leads safely.

### The Secret Magic: Tenant Isolation
The coolest part of Phase 2 is that the user never has to tell us what company they belong to when adding a lead. Our backend automatically looks at their VIP Wristband (JWT Token), finds their `company_id`, and permanently glues it to the Lead. This ensures that Company A can never, ever see Company B's leads!

👉 **For a deep dive into the code behind Phase 2, please read the [PHASE_2_SUMMARY.md](file:///c:/Users/ANIKET/Desktop/NEW%20CRM/PHASE_2_SUMMARY.md) file.**

---

## Phase 3: Telecaller & Attendance Engine (Completed)
This phase turns our CRM into a mini HR system. We built two completely different experiences depending on who is logged in:

### For the Manager (Admin)
Admins can now add their employees (Telecallers) to the CRM. We built a system so the Admin can view their employees' passwords (just like the Figma designs requested!) while still keeping the login engine perfectly secure. Admins can also view exactly how many days their employees worked, and if they took a "Full Day" or a "Half Day".

### For the Employee (Telecaller)
When a Telecaller logs in, they get a self-service time clock. 
- They click **Clock-In** when they arrive.
- They can take **Breaks** (Lunch, Tea, etc.), and the system acts like a stopwatch, pausing their work time.
- When they **Clock-Out**, our custom Math Engine instantly calculates their Gross Time, subtracts their Break Time, and automatically grades them! 

👉 **For a deep dive into the clock-out math and exactly how Phase 3 works, please read the [PHASE_3_SUMMARY.md](file:///c:/Users/ANIKET/Desktop/NEW%20CRM/PHASE_3_SUMMARY.md) file.**

---

### What's Next?
In **Phase 4**, we will build the "Client Engine" (moving a Lead to an active Client)!
