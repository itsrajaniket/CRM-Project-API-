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

### What we will do:
1. **Initialize the Project**: We will run a command to create a `package.json` file. This file keeps track of all the tools (dependencies) our project needs to run.
2. **Install Tools**: We will install Express, Mongoose, and security tools (like `bcrypt` for hiding passwords and `jsonwebtoken` for creating secure login passes).
3. **Connect to the Database**: We will write code to connect our app to MongoDB.
4. **Create Models**: We will create the `Tenant` (Company) and `User` blueprints so the database knows what data to expect.
5. **Build Auth Routes**: We will create the login, register, and password reset endpoints.

*(This file will be updated with more detailed explanations once we start writing the code for Phase 1!)*
