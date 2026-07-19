This is a great approach. To ensure absolutely nothing is missed and the AI receives a flawlessly detailed blueprint, we will break this down into deep-dive modules. I will outline exactly what the UI shows, followed by what that means for the backend architecture.

We will cover the first two massive modules here.

**MASTER FIGMA SPECIFICATION & API PLAN (PART 1\)**

**MODULE 1: Architecture, Authentication & Onboarding**

**What the Figma Shows (UI/UX Flow):**

* **Multi-Portal System:** The platform is physically divided into three workspaces: the **Super Admin Portal** (platform owner), the **CRM User Portal** (the subscribing business/Company Admin), and the **Telecaller Portal** (the employee).  
* **Login & Recovery UI:**  
  * The **Login** screen contains inputs for "Enter Registered Email" and "Password," a "Remember me" checkbox, and a "Forgot Password?" link.  
  * The **Forgot Password** sequence is three separate screens:  
    1. Input Email \-\> "Send OTP" button.  
    2. **Verify OTP** screen with a 6-digit input field.  
    3. **Reset Password** screen with "New Password" and "Confirm Password" (both with visibility eye icons), followed by a success screen.  
* **Business Setup (Onboarding):** Before a Company Admin can access the dashboard, they must complete the **Business Setup \- Basic** screen.  
  * *Required Inputs:* **1\. Business Name**, a **Upload Logo** dropzone, **2\. Team Size** (Dropdown placeholder), **3\. Website**, **4\. Business Email**, **5\. Business Phone Number**, and **6\. GST Number**.

**What We Are Making (API & Database Blueprint):**

* **Multi-Tenancy (Database):** We are building a multi-tenant environment. When the Business Setup is submitted, the API will create a Workspace document in MongoDB containing all those business details. Every other piece of data in the app (users, leads, transactions) will be securely bound to this specific workspaceId.  
* **Role-Based Auth (API):** The /api/auth/login endpoint will return a JWT. This token must carry a role payload (SuperAdmin, Admin, or Telecaller) so the frontend immediately routes the user to the correct portal upon login.  
* **OTP Logic (API):** The /api/auth/forgot-password endpoint will generate a 6-digit code, save it to the user's document with a strict timestamp (e.g., 10-minute expiration), and trigger an email service.

**MODULE 2: The Core CRM (Client & Lead Capture)**

**What the Figma Shows (UI/UX Flow):**

* **Client Management Table:** A paginated list displaying Sr.No., Client Name, Business Name, Phone Number, Email Id, Status (an Active/Inactive toggle switch), and Action icons (View, Edit, Delete).  
* **Add Customer Lead (The Mega Form):** This is the most data-heavy screen in the app. It is divided into distinct collapsible components:  
  * **Customer Details:** Standard text fields for Full Name, Phone Number, Email Id, Country, State, City, Street, and Pincode.  
  * **Basic Information:** Upload Logo, Business Name, Client Industry (Dropdown), Select Country (Dropdown), City/Town.  
  * **Tax Information (Optional):** Inputs for Business GSTIN, Business PAN Number, a radio button for Client Type (**Individual** vs. **Company**), and a Tax Treatment dropdown.  
  * **Shipping Details (Optional):** Features a master checkbox ("Add Shipping Details"). If checked, it splits into **Shipped From** (Warehouse dropdown, Business Name, Address block) and **Shipped To** (Shipping Address dropdown, "Same as client's address" checkbox, Address block, Client's GSTIN).  
  * **Transport Details:** Dropdowns and inputs for Transporter Details, Distance(in Km), Challan Number, Challan Date (calendar picker), Vehicle Type, Vehicle Number, Transaction Type, Sub Supply Type.  
  * **Custom Fields:** A dynamic section where users can click a **"+ Add Custom Fields"** button to generate new Field Name/Value text boxes on the fly.  
* **Delete Overlay:** A central modal asking "Are You Sure Want To Delete This Lead?" with Cancel and Delete buttons.

**What We Are Making (API & Database Blueprint):**

* **Dynamic Client Schema (Database):** Because of the massive variability in this form, the Client MongoDB model will utilize deeply nested objects (e.g., taxProfile: { gst, pan, type }) and a flexible array of objects or a Mongoose Map for the Custom Fields so the database doesn't break when a user adds unpredictable data.  
* **Conditional Payloads (API):** The POST /api/clients endpoint must be built to accept partial payloads. If the "Add Shipping Details" checkbox is left unchecked on the frontend, the API must gracefully save the lead without requiring the logistics data.  
* **Soft Deletion (API):** Because deleting a lead might break historical interaction data, the DELETE /api/clients/:id endpoint will likely perform a "soft delete" (changing a isDeleted boolean to true in the database) rather than permanently erasing the record.

I will stop right here so we do not hit any output limits and preserve maximum detail.

Here is Part 2, continuing with the exact same level of granular detail for the remaining modules. You can append this directly to the first part.

**MASTER FIGMA SPECIFICATION & API PLAN (PART 2\)**

**MODULE 3: Telecaller Workforce & Time Tracking Engine**

**What the Figma Shows (UI/UX Flow):**

* **Telecaller Management (Company Admin View):** A global table listing all staff. It displays Sr.No., Telecaller Name, Phone Number, Email Id, Password (shown as text, e.g., "Password@123"), a Status toggle (Active/Inactive), and Action icons.  
* **Add / Edit Telecaller Forms:** Admins provision accounts by uploading a Profile Image and inputting Full Name, Phone Number, Email ID, and assigning a Password.  
* **Attendance History Calendar (Admin View):** Clicking into a Telecaller Details page reveals a calendar UI.  
  * *Top bar:* Month/Year selector.  
  * *Summary Cards:* Total Work Days, Full Day, Half Day, Absent counters.  
  * *Daily Logs:* Below the calendar, specific days are listed showing "Shift Date & Time" (e.g., 10:00 AM \- 07:00 PM), "Total Work Time" (e.g., 08:15 hrs), a status badge (Full Day / Half Day), and a Break counter badge (e.g., "2 Break"). Clicking "View Details" opens an overlay showing exact start/end times for each break that day.  
* **Telecaller Dashboard (Employee View):**  
  * *Header Stats:* Shows the employee's Name, "Clock in at \[Time\]", Net Work Time, Net Breaks Time, Remaining Time, and Expected Clock Out time.  
  * *Action Center:* A massive red "Clock Out" button.  
  * *Break Controls:* A grid of "Take a Break" buttons categorized into: Lunch Break (45 min), Tea Break (15 min), Meeting (Variable), Training (Variable), and Other (Custom).  
  * *Today's Breaks:* A live list tracking active and completed breaks for the current shift.  
* **Clock-Out Smart Alerts:** If a telecaller attempts to clock out, the system intercepts with one of three modal overlays based on elapsed time:  
  1. **Very Early Clock Out Alert:** (Red warning) "You are clocking out very early. This may be marked as Half Day or Absent..." Shows Work Duration vs Required.  
  2. **Half Day Clock Out Alert:** (Orange warning) "You are about to clock out before completing the full working hours. This will be marked as a Half Day."  
  3. **Full Day Confirmation:** (Green success) "You have completed the required working hours... marked as a Full Day."

**What We Are Making (API & Database Blueprint):**

* **Shift & Attendance Schema (Database):** This requires two tightly coupled MongoDB collections: Attendance (storing the overall shift date, clock-in, clock-out, and final status) and Breaks (storing the specific break type, start, and end timestamps, linked to the daily Attendance ID).  
* **Time-Math Logic (API):** The PUT /api/attendance/clock-out endpoint is the most complex logic center of the app. It must:  
  1. Calculate gross elapsed time between clock-in and clock-out.  
  2. Query and sum the duration of all child Breaks for that shift.  
  3. Subtract break time from gross time to get true "Net Work Time."  
  4. Compare Net Work Time against the company's expected hours to automatically assign the "Full Day," "Half Day," or "Absent" status before saving to the database.

**MODULE 4: Interaction Tracking & CRM Timeline**

**What the Figma Shows (UI/UX Flow):**

* **Global Work History Table:** Displayed on the Admin Dashboard, this table tracks every recent action across the entire company. Columns include Sr.No., Business Name, Phone Number, Subscription Plans (Free, Silver, Gold, Platinum), Interaction Mode (Call, WhatsApp, Email), Latest Interaction, and Action. It has filtering tabs for "Today," "Yesterday," and "Custom Date," plus an "Export Report" button.  
* **Add Interaction Overlay:** A clean modal for logging touchpoints.  
  * *Inputs:* Interaction Mode dropdown (Call, WhatsApp, Email) and Interaction Type dropdown (Call Connect, Call Disconnect, Follow Up, Payment Done, Interested, Not Interested, Busy, Switch Off, Call back, Language Barrier, Number Invalid, Voice Mail, Not Received).  
  * *Follow-Up Trigger:* If "Follow Up" is selected, a new input appears with a calendar icon to set a "Follow Up Date" (DD/MM/YYYY).  
* **Chronological Timeline UI (Client Details):** Inside a specific client's profile, the left column features a vertical timeline labeled "Interaction History." Each node displays:  
  * A visual icon matching the mode (e.g., green phone, WhatsApp icon).  
  * The Interaction Type (e.g., "Call Disconnected").  
  * The exact timestamp (e.g., "Jan 28, 2:30 PM").  
  * An attribution label: "Updated By: \[Telecaller Name\]".

**What We Are Making (API & Database Blueprint):**

* **Interaction Schema (Database):** The Interactions collection will bind multiple documents together, requiring references to clientId, telecallerId, and companyId, alongside the mode, type, and timestamp string.  
* **Population Aggregation (API):** When the frontend requests GET /api/clients/:id/interactions, the backend must perform a .populate('telecallerId', 'fullName') command so the database returns the human-readable employee name for the timeline UI, rather than just raw database ObjectIDs.  
* **Follow-Up Scheduler (API/Backend):** Storing a followUpDate requires the backend to either implement a CRON job to send notifications on that date, or simply expose a filtered endpoint (GET /api/interactions/pending-followups) that the dashboard queries on load.

**MODULE 5: Subscriptions, Revenue & Global Features**

**What the Figma Shows (UI/UX Flow):**

* **Subscription Management (Super Admin):** A table listing active SaaS tiers (Silver, Gold, Platinum) with Plan Price, Plan Validity (e.g., 1 Months), allowed Users, and action icons.  
* **Add/Edit Plan UI:** Super admins input Plan Name, Plan Price, Validity, Share Access With User (dropdown), and a checkbox for "Support 24x7."  
* **Upgrade Plan Overlay (Company Admin):** A checkout UI allowing businesses to upgrade.  
  * *Inputs:* Select Plan dropdown (Silver, Gold, etc.), Discount (%) field, and a manual input for "Enter Transaction ID."  
  * *Calculations:* The UI actively displays "Total Amount to be paid Now (including 18% GST) ₹ 1,999".  
* **Revenue Management Dashboard:**  
  * *Top Cards:* Total Revenue, Revenue From Online, Revenue From Telecaller.  
  * *Transaction Table:* Logs Sr.No., Transaction ID, Client Name, Plan, Amount, Sell By, Status (Successful badge).  
  * *Payment Details Page:* A receipt view showing exactly who processed the payment, the payment method (Online), date, amount, and plan validity.  
* **Global Sidebar Notifications:** A slide-out panel that stacks alerts (New Lead, Profile Update, Payment Received) with green checkmarks or user icons, showing elapsed time (e.g., "2 sec ago", "15 min ago") and a "Mark All Read" text button.  
* **Profile Overlays:** Users click their avatar to open an "Edit Profile Info" overlay (Full Name, Email ID, Mobile No., image upload) or a "Change Password" overlay requiring the old and new passwords.

**What We Are Making (API & Database Blueprint):**

* **Financial Math Engine (API):** The /api/billing/upgrade endpoint must re-verify the math securely on the backend. It must calculate the base plan price, subtract the applied discount percentage, and accurately add the 18% GST before logging the transaction to the database to prevent frontend manipulation.  
* **Revenue Aggregation (Database Queries):** The Revenue Dashboard requires MongoDB Aggregation Pipelines. The API must use $match to filter current month transactions, and $group them by paymentMethod (Online vs. Telecaller) to dynamically generate the data for the three revenue cards.  
* **Notification Engine (API):** Requires a generic Notifications collection. When major endpoints are hit (e.g., POST /api/clients or PUT /api/billing/upgrade), the Express controller must simultaneously write a new alert document to this collection so it immediately populates in the frontend sidebar.

 

 

 

 

NEXT Master API Architecture & Database Plan.

This is the start of your **Master API Architecture & Database Plan**. Because you requested extreme detail to avoid output limits and to make this directly actionable for coding, I am splitting this into a 4-part series.

This is **Part 1 of 4**, covering the high-level architecture, the multi-tenancy strategy, and the first foundational database schemas.

**MASTER API & DATABASE PLAN: PART 1 OF 4**

**Foundational Architecture & Core Data Modeling**

**1\. Architectural Philosophy**

Since this is a B2B SaaS platform, the architecture must prioritize **Data Isolation**. No company should ever be able to access the leads, telecallers, or revenue data of another company.

* **Technology Stack:** MERN (MongoDB, Express, React, Node.js).  
* **Multi-Tenancy Strategy:** We will use **"Logical Separation."** Every document in the database (Leads, Telecallers, Interactions, Transactions) will contain a tenantId (or companyId).  
  * *Why:* This allows us to host all companies on one database instance while using middleware to automatically filter queries by the authenticated user's companyId.  
* **Request/Response Standard:** All API responses will follow a standard JSON structure:

JSON

{

  "success": true,

  "data": {},

  "message": "Operation successful"

}

**2\. Core Database Schemas (Deep-Dive)**

We will use **Mongoose (MongoDB)** for these definitions.

**A. The** Tenant **(Company) Schema**

This is the root of your multi-tenancy. Every other object points back to this.

JavaScript

const TenantSchema \= new Schema({

  businessName: { type: String, required: true },

  logoUrl: String,

  teamSize: String,

  website: String,

  businessEmail: { type: String, required: true },

  businessPhone: String,

  gstNumber: String,

  subscriptionPlanId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' },

  status: { type: String, enum: \['Active', 'Inactive'\], default: 'Active' },

  createdAt: { type: Date, default: Date.now }

});

**B. The** User **Schema (The Multi-Role Hub)**

This schema handles Super Admins, Company Admins, and Telecallers. We use a discriminator or role field to determine portal access.

JavaScript

const UserSchema \= new Schema({

  companyId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },

  role: {

	type: String,

	enum: \['SuperAdmin', 'Admin', 'Telecaller'\],

	required: true

  },

  fullName: { type: String, required: true },

  email: { type: String, required: true, unique: true },

  passwordHash: { type: String, required: true },

  phone: String,

  profileImg: String,

  status: { type: String, enum: \['Active', 'Inactive'\], default: 'Active' }

});

**C. The** Client/Lead **Schema (The "Custom Field" Master)**

This handles the massive, complex forms shown in your Figma. The key here is the customFields property which is a Map (allowing dynamic key/value pairs).

JavaScript

const ClientSchema \= new Schema({

  companyId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },

  fullName: { type: String, required: true },

  phone: String,

  email: String,

  // Nested Address Object

  address: {

	country: String,

	state: String,

	city: String,

	street: String,

	pincode: String

  },

  // Tax Info

  taxInfo: {

	gstNumber: String,

	panNumber: String,

	clientType: { type: String, enum: \['Individual', 'Company'\] },

	taxTreatment: String

  },

  // Dynamic Fields \- This is how we handle "+ Add Custom Field"

  customFields: {

	type: Map,

	of: String

  },

  status: { type: String, enum: \['Active', 'Inactive'\], default: 'Active' }

});

**Why this structure works for your API:**

1. **Logical Isolation:** By including companyId in the Client and User schemas, you can build a middleware function that injects { companyId: req.user.companyId } into every Mongoose query automatically. This prevents data leaks.  
2. **Scalability:** Using Map for customFields means you don't have to alter your database schema every time a user wants to track a weird, specific data point (like "UPI ID" or "Secondary Contact"). It just works as a dictionary object.  
3. **Relational Ease:** We are keeping the collections separate (Tenant, User, Client) so that queries for "all telecallers" or "all leads" remain lightning-fast.

**This concludes Part 1\.**

In **Part 2**, I will detail the complex **Logistics/Shipping Schema** and the **Attendance/Break Engine Schema** (the most logic-heavy part of the app).

**MASTER API & DATABASE PLAN: PART 2 OF 4**

**Logistics, Workforce Attendance, & Break Engines**

Now we dive into the heavy operational logic of the CRM. These schemas require careful planning because they handle both massive form data (shipping) and strict time-math calculations (attendance).

**3\. Logistics & Shipping Database Modeling**

The Figma designs showed an incredibly detailed "Add Shipping Details" module that can be toggled on or off. Because this data is highly specific and can clutter the main Client profile, we separate it into a dedicated ShippingLog collection.

**D. The** ShippingLog **Schema**

This schema handles physical goods tracking, capturing everything from warehouse origins to the exact transport vehicle.

JavaScript

const ShippingSchema \= new Schema({

  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },

  companyId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },

 

  shippedFrom: {

	warehouse: String,

	businessName: String,

	country: String,

	address: String,

	city: String,

	state: String,

	pincode: String

  },

 

  shippedTo: {

	isSameAsClient: { type: Boolean, default: false }, // Handles the frontend checkbox

	businessName: String,

	country: String,

	address: String,

	city: String,

	state: String,

	pincode: String,

	clientGstin: String

  },

 

  transportDetails: {

	transporterName: String,

	distanceKm: Number,

	challanNumber: String,

	challanDate: Date,

	vehicleType: String,

	vehicleNumber: String,

	transactionType: String,

	subSupplyType: String

  }

}, { timestamps: true });

**4\. Workforce Time & Attendance Engine**

This is the most mathematically rigorous part of the backend. To keep MongoDB highly performant, we **must not** embed every single break into the Attendance document. Arrays that grow unpredictably can degrade database speed. Instead, we split them into two tightly coupled collections: Attendance and Breaks.

**E. The** Attendance **Schema (The Daily Shift)**

This document is created the moment a telecaller clicks the green "Clock In" button.

JavaScript

const AttendanceSchema \= new Schema({

  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  companyId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },

 

  // Normalized to 00:00:00 of that day for easy calendar queries

  date: { type: Date, required: true },

 

  shiftStartTime: { type: Date, required: true },

  shiftEndTime: { type: Date },

 

  // Standard shift requirement (e.g., 9 hours \= 540 mins)

  expectedHoursMins: { type: Number, default: 540 },

 

  // Calculated dynamically by the backend on Clock-Out

  totalNetWorkTimeMins: { type: Number, default: 0 },

 

  status: {

	type: String,

	enum: \['Active', 'Full Day', 'Half Day', 'Absent'\],

	default: 'Active'

  }

});

**F. The** Break **Schema**

Every time a telecaller clicks a "Take a Break" button (Lunch, Tea, Meeting), a new document is created here.

JavaScript

const BreakSchema \= new Schema({

  attendanceId: { type: Schema.Types.ObjectId, ref: 'Attendance', required: true },

  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

 

  breakType: {

	type: String,

	enum: \['Lunch Break', 'Tea Break', 'Meeting', 'Training', 'Other \- Personal'\],

	required: true

  },

 

  startTime: { type: Date, required: true },

  endTime: { type: Date }, // Populated when they click "End Break"

 

  // Calculated dynamically when the break ends

  durationMins: { type: Number, default: 0 }

});

**5\. Backend Business Logic: The "Clock-Out" Math Engine**

When a telecaller attempts to clock out, the frontend will hit the PUT /api/attendance/clock-out endpoint. The Express controller must execute the following sequence to guarantee data integrity:

1. **Close Open Breaks:** Query the Breaks collection for any document tied to this attendanceId that has no endTime. If one exists, stamp the current time and calculate its durationMins.  
2. **Calculate Gross Time:** Subtract the shiftStartTime from the current time (the shiftEndTime).  
3. **Sum Total Breaks:** Run a MongoDB aggregation ($match the attendanceId, $group to $sum the durationMins) to get the total time the employee spent on breaks.  
4. **Determine Net Time:** Gross Time \- Total Break Time \= totalNetWorkTimeMins.  
5. **Assign Status Validation:**  
   * If totalNetWorkTimeMins \>= expectedHoursMins (e.g., 9 hours), set status to **"Full Day"**.  
   * If totalNetWorkTimeMins is less than expected but greater than half (e.g., \> 4.5 hours), set status to **"Half Day"**.  
   * If totalNetWorkTimeMins is drastically low, set status to **"Absent"** (based on company policy parameters).  
6. **Save & Return:** Update the Attendance document with these final calculations and return the success confirmation so the frontend can display the final alert overlay.

**MASTER API & DATABASE PLAN: PART 3 OF 4**

**The CRM Interaction Timeline & Financial Engine**

This module covers the core tracking mechanisms of the application. It dictates how telecallers log their daily client touchpoints and how the platform manages its internal SaaS subscription revenue.

**6\. Interaction & CRM Timeline Modeling**

To generate the vertical "Interaction History" timeline shown in the Client Details view, we need a dedicated collection that tracks every single touchpoint independently. This ensures the timeline scales indefinitely without bloating the main Client document.

**G. The** Interaction **Schema**

This schema captures the exact mode, type, and employee responsible for the client communication.

JavaScript

const InteractionSchema \= new Schema({

  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },

  companyId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },

  telecallerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

 

  interactionMode: {

	type: String,

	enum: \['Call', 'WhatsApp', 'Email'\],

	required: true

  },

 

  interactionType: {

	type: String,

	enum: \[

  	'Call Connect', 'Call Disconnect', 'Follow Up', 'Payment Done',

  	'Interested', 'Not Interested', 'Busy', 'Switch Off', 'Call back',

  	'Language Barrier', 'Number Invalid', 'Voice Mail', 'Not Received'

	\],

	required: true

  },

 

  // Conditionally required only if interactionType \=== 'Follow Up'

  followUpDate: { type: Date },

 

  notes: { type: String }

}, { timestamps: true }); // Automatically handles the exact date/time of the log

**API Implementation Note (The Timeline Query):**

When the frontend loads a client's profile, it will hit GET /api/interactions/client/:clientId.

The Express controller must use Mongoose's .populate() method to inject the human-readable employee name into the response for the UI:

JavaScript

// Backend snippet for Timeline generation

const timeline \= await Interaction.find({ clientId: req.params.clientId })

  .sort({ createdAt: \-1 }) // Sorts newest to oldest for the vertical UI

  .populate('telecallerId', 'fullName profileImg'); // Injects employee details

**7\. Subscriptions, Billing & Revenue Modeling**

The Super Admin and Company Admin portals both rely heavily on this architecture. The Super Admin creates the SubscriptionPlan, and the Company Admin generates a Transaction when they upgrade.

**H. The** SubscriptionPlan **Schema**

This dictates the SaaS tiers (Silver, Gold, Platinum) and their inherent limitations.

JavaScript

const SubscriptionPlanSchema \= new Schema({

  planCategory: {

	type: String,

	enum: \['Free', 'Silver', 'Gold', 'Platinum'\],

	required: true

  },

  planPrice: { type: Number, required: true },

  validityMonths: { type: Number, required: true }, // e.g., 1, 6, or 12

 

  features: {

	maxUsers: { type: Number, required: true }, // Share Access With User limit

	support24x7: { type: Boolean, default: false }

  },

 

  isActive: { type: Boolean, default: true } // Super Admin can soft-delete old plans

}, { timestamps: true });

**I. The** Transaction **Schema (The Receipt)**

When an upgrade is processed via the "Upgrade Plan Overlay", this document acts as the permanent, immutable receipt for the Revenue Dashboard.

JavaScript

const TransactionSchema \= new Schema({

  companyId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },

  planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },

 

  // The external reference ID from the payment gateway (e.g., Razorpay/Stripe)

  transactionId: { type: String, required: true, unique: true },

 

  // Financial breakdown

  baseAmount: { type: Number, required: true },

  discountPercentage: { type: Number, default: 0 },

  taxAmount: { type: Number, required: true }, // Hardcoded or calculated 18% GST

  totalPaid: { type: Number, required: true },

 

  paymentMethod: {

	type: String,

	enum: \['Online', 'Offline/Manual'\],

	default: 'Online'

  },

 

  // Attribution for the "Sell By" column in the Revenue table

  saleById: { type: Schema.Types.ObjectId, ref: 'User' },

 

  status: {

	type: String,

	enum: \['Pending', 'Successful', 'Failed'\],

	default: 'Successful'

  }

}, { timestamps: true });

**8\. Backend Business Logic: The Revenue Aggregator**

The **Revenue Management Dashboard** requires a complex calculation. It cannot simply query a static number; it must calculate the total revenue dynamically to keep the "Revenue From Online" and "Revenue From Telecaller" cards accurate.

When GET /api/billing/dashboard-stats is called, the Express controller will run a MongoDB Aggregation Pipeline:

1. $match: Filter the Transaction collection to only include documents where status \=== 'Successful' and the createdAt date falls within the current month.  
2. $group: Group the data by paymentMethod.  
3. $sum: Tally the totalPaid field for each group.  
4. **Response**: Return a JSON object with the exact totals for the UI cards, preventing the frontend from having to do any heavy array mathematics.

**End of Part 3\.**

Part 4 will conclude the master plan, covering the **Global Notifications Schema**, the **System Configuration/Settings**, and the **Final API Endpoint Route Map** to tie everything together.

**MASTER API & DATABASE PLAN: PART 4 OF 4**

**Global Notifications, Profile Settings & Final Route Map**

This final module covers the system-wide alerts, user profile management, and provides the complete API routing cheat sheet to tie the entire MERN stack architecture together.

**9\. Global System Notifications Modeling**

The Figma designs showed a persistent, slide-out notification panel on the right side of the screen. This panel displays alerts for events like "New Lead," "Profile Update," and "Payment Received." To make this work dynamically without bogging down other collections, we need a standalone Notification schema.

**J. The** Notification **Schema**

This acts as a global inbox for alerts.

JavaScript

const NotificationSchema \= new Schema({

  companyId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },

 

  // Optional: If null, the notification broadcasts to all Admins in the company.

  // If populated, it sends to a specific Telecaller/User.

  targetUserId: { type: Schema.Types.ObjectId, ref: 'User' },

 

  type: {

	type: String,

	enum: \['Lead', 'Payment', 'System', 'Profile'\],

	required: true

  },

 

  title: { type: String, required: true }, // e.g., "New Client Added"

  message: { type: String }, // e.g., "Lorem ipsum dolor sit amet..."

 

  isRead: { type: Boolean, default: false }

}, { timestamps: true });

**API Implementation Note (The Notification Trigger):**

This collection is unique because it is rarely written to directly by a frontend user. Instead, the backend creates these documents internally. For example, inside the POST /api/clients controller, immediately after the client.save() function succeeds, the Express server should execute a Notification.create() function to log the "New Lead" alert automatically.

**10\. Profile & File Upload Management**

The designs allow users to update their Profile Image, Name, and Password via central overlays.

* **File Uploads:** For the profile images (and the Business Logo in the onboarding flow), the backend should utilize a middleware like multer combined with cloud storage (like AWS S3 or Cloudinary). The database will only store the secure URL string (profileImg: "\[https://cloudinary.com/\](https://cloudinary.com/)..."), not the actual image file.  
* **Password Hashing:** The PUT /api/users/change-password route must retrieve the current user, use bcrypt.compare() against the "Old Password" input, and then apply bcrypt.hash() to the "New Password" before saving.

**11\. The Complete API Endpoint Route Map**

Here is the finalized cheat sheet for your Express router structure, categorized by resource.

**Authentication & Onboarding (**/api/auth**)**

* POST /register \- Initializes Workspace and Admin User.  
* POST /login \- Returns JWT.  
* POST /forgot-password \- Generates 6-digit OTP.  
* POST /verify-otp \- Validates OTP.  
* PUT /reset-password \- Updates hashed password.

**User & Profile Management (**/api/users**)**

* GET /me \- Returns logged-in user profile data.  
* PUT /me \- Updates Name, Email, Phone, and Profile Image URL.  
* PUT /change-password \- Securely updates the password.  
* POST /telecallers \- Admin provisions a new employee account.  
* GET /telecallers \- Fetches the staff table data.  
* PUT /telecallers/:id/status \- Toggles staff Active/Inactive state.

**Client & Lead Engine (**/api/clients**)**

* POST / \- Creates a new lead (handles nested shipping/tax/custom data).  
* GET / \- Fetches paginated lead table (filtered by companyId).  
* GET /:id \- Fetches deep profile data for a single client.  
* PUT /:id \- Updates specific client details.  
* DELETE /:id \- Soft-deletes a client document.

**Interaction Timeline (**/api/interactions**)**

* POST / \- Logs a new Call/Email/WhatsApp action.  
* GET / \- Fetches global Work History table data.  
* GET /client/:clientId \- Fetches the vertical timeline history.

**Workforce Time & Attendance (**/api/attendance**)**

* POST /clock-in \- Initiates daily shift document.  
* POST /break/start \- Appends an active break object.  
* PUT /break/end \- Closes the active break and calculates duration.  
* PUT /clock-out \- Finalizes shift math and assigns Full/Half Day status.  
* GET /employee/:userId \- Fetches the calendar history for a specific staff member.

**Subscriptions & Revenue (**/api/billing**)**

* GET /plans \- Retrieves SaaS pricing tiers.  
* POST /upgrade \- Processes transaction ID and updates company plan.  
* GET /dashboard-stats \- Aggregates online vs. telecaller revenue totals.

**System Notifications (**/api/notifications**)**

* GET / \- Fetches the user's unread sidebar alerts.  
* PUT /:id/read \- Marks a specific notification as read.  
* PUT /read-all \- Clears the unread badge for all alerts.

