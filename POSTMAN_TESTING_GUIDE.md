# The Postman Testing Sequence Guide (Expanded)

> **Author:** Aniket's Backend AI
> **Purpose:** A deep-dive educational guide on how to test the CRM backend, explaining *why* we take each step and *what* the code is doing under the hood.

---

## 🧠 The Concept: Why are we doing this?
Before a Frontend Team builds a beautiful React User Interface, Backend Developers must prove their code works. 
We use **Postman** as a "Fake Frontend". 
- **Postman** = The Fake User clicking buttons on a screen.
- **Node.js Server** = The Kitchen receiving the data and processing the business logic.
- **MongoDB** = The Vault where the data is permanently saved.

If you click an API out of sequence, the server will reject you! Our database is **Relational**, meaning data depends on other data (e.g., You can't create a Lead until your Company exists!).

---

## 🟢 LEVEL 1: The Admin Setup (Getting the Keys)

### 1. Register Admin
- **Action:** Open Phase 1, click **"1. Register Admin"**, and hit **Send**.
- **Why we do this:** Our CRM is "Multi-Tenant" (multiple companies use it). The very first step is creating a brand new company in the database and an Admin to run it.
- **What happens under the hood:** The Express server hashes your password, saves you in MongoDB, and generates a **JWT Security Token**.
- **Crucial Step:** Look at the response and **COPY the `"token"`** (e.g., `eyJhbG...`). This is your digital VIP wristband.

### 2. Business Setup
- **Action:** Open **"2. Business Setup"**. Go to Headers, and paste your Token over `YOUR_TOKEN_HERE`. Hit **Send**.
- **Why we do this:** When you first register, your company is marked as "Pending Setup". This API injects real data (like GST No and Address) into the company record and marks it as "Active".
- **What happens under the hood:** Our `authMiddleware` checks your token, verifies you are the Admin, and updates your specific company in MongoDB.

---

## 🔵 LEVEL 2: Managing Leads (Relational Data)

*Now that your company exists, you can start adding customers. You MUST use your Admin Token in the Headers for all these steps!*

### 1. Create Lead
- **Action:** Open **"1. Create Lead"**. Paste your Admin Token in the Headers. Hit **Send**.
- **Why we do this:** To add a potential customer to your company's database.
- **What happens under the hood:** The server looks at your Token, figures out your `company_id`, and permanently locks this lead to *your* company. Hackers cannot assign this lead to anyone else!
- **Crucial Step:** Look at the response and **COPY the `_id`** (e.g., `64f1c...`). This is the Lead's unique ID.

### 2. View All Your Leads
- **Action:** Open **"2. Get All Leads"**. Paste your Admin Token in the Headers. Hit **Send**.
- **Why we do this:** To fetch a list of every lead your company owns.
- **What happens under the hood:** The database strictly filters out any leads belonging to other companies and returns only yours.

### 3. Update The Lead
- **Action:** Open **"4. Update Lead"**. Paste your Admin Token in Headers. Go to the URL bar and replace `LEAD_ID_HERE` with the `_id` you copied in Step 1. Hit **Send**.
- **Why we do this:** Because data changes over time. We are changing the lead's status to "Contacted".
- **What happens under the hood:** The server uses the `_id` in the URL to find the exact row in MongoDB and updates just that specific row.

---

## 🟠 LEVEL 3: The Telecaller & HR Engine (Role-Based Access)

*This level proves our "Role-Based Security" works. Admins can create employees, but Admins CANNOT clock in. Only Employees can clock in!*

### 1. Create Telecaller
- **Action:** Open **"1. Create Telecaller"** (inside Phase 3). Paste your **Admin Token** in the Headers. Hit **Send**.
- **Why we do this:** The Admin is hiring a new employee named "Agent Smith". 

### 2. Login as the Telecaller
- **Action:** Go back to Phase 1 and click **"3. Login (Admin / Telecaller)"**. Change the JSON Body to use the Telecaller's email (`smith@crm.com`) and password (`agent123`). Hit **Send**.
- **Why we do this:** We must take off our "Admin Hat" and put on our "Telecaller Hat". We are simulating Agent Smith arriving at work and logging into his computer.
- **Crucial Step:** **COPY the new `"token"`**. This is your **Telecaller Key**! (Your old Admin Key will not work for the next steps).

### 3. Clock In
- **Action:** Open **"9. Clock In"** (in Phase 3). Paste your **Telecaller Token** in the Headers. Hit **Send**.
- **Why we do this:** Agent Smith is starting his shift.
- **What happens under the hood:** The server creates an `Attendance` record in MongoDB and timestamps the exact second he hit the button. If he tries to hit it again today, the server will block him!

### 4. Start a Break
- **Action:** Open **"13. Start Break"**. Paste your **Telecaller Token** in the Headers. Hit **Send**.
- **Why we do this:** Agent Smith is going to lunch.
- **Crucial Step:** **COPY the break `_id`** from the response!

### 5. End a Break
- **Action:** Open **"14. End Break"**. Paste your Telecaller Token in Headers. Replace `BREAK_ID_HERE` in the URL with the ID you just copied. Hit **Send**.
- **What happens under the hood:** The server calculates the exact number of minutes between the Start and End time and saves it in MongoDB.

### 6. Clock Out (The Math Engine)
- **Action:** Open **"10. Clock Out Preview"**. Paste your Telecaller Token in Headers. Hit **Send**.
- **Why we do this:** Agent Smith is going home.
- **What happens under the hood:** This is the most complex API in the project. It calculates Gross Work Time, subtracts the Lunch Break duration, finds the Net Work Time, and automatically grades the employee as "Full Day", "Half Day", or "Absent"!
