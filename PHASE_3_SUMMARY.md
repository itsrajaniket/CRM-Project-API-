# Phase 3 Summary: Telecaller Management & Attendance

This document breaks down the creation of our CRM's internal HR and Time-Tracking engine. We built two distinct sets of APIs: one for Admins to manage their team, and one for Telecallers to track their own work hours.

## 1. What We Did in This Phase
We introduced "Telecallers" (employees) into the system. Admins can now create Telecaller accounts. Once logged in, Telecallers can "Clock In" to start their shift, log specific breaks (like lunch or meetings), and "Clock Out". Upon clocking out, the server runs a complex math engine to deduct break times and automatically determine if the employee worked a "Full Day" or a "Half Day". 

## 2. Prerequisites
- The Phase 1 Authentication engine is heavily utilized here.
- For the `/api/telecallers` endpoints, the user must log in and receive an **Admin** JWT Token.
- For the `/api/attendance` and `/api/breaks` endpoints, the user must log in and receive a **Telecaller** JWT Token.

## 3. Data Sets (Database Schemas)
We updated one existing schema and created two new ones:

1. **User (Updated)**
   - We did not create a separate "Telecaller" model. A Telecaller is just a User with `role: 'Telecaller'`.
   - **The Figma Password Trick:** To satisfy the Figma design requirement where Admins can see the passwords of their employees, we added a `plain_password` field to the User schema. The system still strictly hashes the actual `password` field for secure logins, but saves a readable copy in `plain_password` just for the Admin dashboard!

2. **Attendance**
   - **Purpose:** Represents one workday for one user.
   - **Fields:** User ID, Company ID, Date (set to exactly midnight so we don't accidentally create two records for one day), Shift Start, Shift End, Expected Minutes (default 9 hours), Net Work Minutes, and Status (Full Day, Half Day, etc.).

3. **Break**
   - **Purpose:** Represents a pause in the workday.
   - **Fields:** Attendance ID (to link it to the workday), User ID, Break Type (Lunch, Tea, etc.), Reason (required if type is 'Other'), Start Time, End Time, and Duration in Minutes.

## 4. How the Code Flows (The Clock-Out Math Engine)
The most complex part of this phase is when a Telecaller clicks "Clock Out". Here is how the server handles it:
1. **Validation:** Checks if they actually clocked in today. If not, it throws an error.
2. **Auto-Close Breaks:** If the Telecaller forgot to click "End Break" before clocking out, the server automatically closes the open break for them.
3. **Gross Time:** Calculates how many total minutes passed between Clock-In and Clock-Out.
4. **Total Break Time:** Adds up the duration of every single break they took today.
5. **Net Work Time:** `Gross Time` minus `Total Break Time`.
6. **Grading:** If Net Work Time >= 9 hours, they get a "Full Day". If it's >= 4.5 hours, they get a "Half Day". Otherwise, it triggers a "very early" warning.
7. **Two-Step Confirmation:** The frontend can run a "preview" (using `?confirm=false`) to show the user a warning modal. Once confirmed (`?confirm=true`), the math is permanently saved to the database.

## 5. Total APIs Built

### Telecaller Management (Admin Only)
- **`POST /api/telecallers`**: Creates a new Telecaller. Enforces the Admin's `company_id` and saves both the hashed and plain-text passwords.
- **`GET /api/telecallers`**: Lists all active telecallers in the company, returning the `plain_password` for the UI. (Supports search/pagination).
- **`GET /api/telecallers/:id`**: Gets a single telecaller.
- **`PUT /api/telecallers/:id`**: Updates telecaller details (and safely handles password changes).
- **`DELETE /api/telecallers/:id`**: Soft-deletes a telecaller.
- **`PATCH /api/telecallers/:id/status`**: Quickly toggles an employee's status between Active and Inactive.
- **`GET /api/telecallers/:id/attendance` & `.../breaks`**: Allows the Admin to fetch the historical timecards for a specific employee.

### Attendance & Breaks (Telecaller Only)
- **`POST /api/attendance/clock-in`**: Creates today's timecard and records the start time.
- **`PUT /api/attendance/clock-out`**: Runs the Math Engine described above.
- **`GET /api/attendance/today`**: Fetches the live, currently running shift data.
- **`GET /api/attendance/history`**: Fetches the Telecaller's own historical shifts for a specific month/year.
- **`POST /api/breaks/start`**: Pauses the workday and starts a timer.
- **`PUT /api/breaks/:id/end`**: Stops the timer and calculates exactly how many minutes the break lasted.
- **`GET /api/breaks/active`**: Checks if the Telecaller is currently on a break.

---

## 6. Deep Dive: File Structure & Function Breakdown

### Structure Additions
```text
backend/
├── src/
│   ├── models/
│   │   ├── Attendance.js             # Blueprint for a workday
│   │   └── Break.js                  # Blueprint for a pause in work
│   ├── routes/
│   │   ├── telecallerRoutes.js       # Traffic cop for Admin managing employees
│   │   ├── attendanceRoutes.js       # Traffic cop for Clock In/Out
│   │   └── breakRoutes.js            # Traffic cop for pausing work
│   └── controllers/
│       ├── telecallerController.js   # Brain for managing employees
│       ├── attendanceController.js   # Brain for math and time-tracking
│       └── breakController.js        # Brain for break durations
```

### Key Functions Explained

- **`telecallerController.js -> createTelecaller`**: Checks if the email already exists. If not, it uses `bcrypt` to mathematically hash the password so the login system works, but *also* saves the raw text password to `plain_password` to fulfill the Figma UI requirements. Finally, it forces `role: 'Telecaller'` so an Admin can't accidentally create another Admin!
- **`attendanceController.js -> clockIn`**: Looks at the calendar. If you already have a timecard for `Today`, it throws an error (you can't clock in twice on the same day). If clear, it stamps the current time as `shift_start_time`.
- **`attendanceController.js -> clockOut`**: This is the massive math engine described in Section 4. It does the Gross/Net calculations, auto-closes breaks, and figures out your Full/Half day status.
- **`breakController.js -> startBreak`**: Checks two things before letting you go on break: 1) Are you actually clocked in today? 2) Are you *already* on a break? If both pass, it starts a timer. If it's a "Personal" break, it throws an error if you didn't provide a typed reason.
- **`breakController.js -> endBreak`**: Looks at the clock, subtracts the `start_time` of the break from "Right Now", turns that into minutes, and saves it as `duration_minutes`.
