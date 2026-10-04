# All Things Human Resources

All Things Human Resources is a database-backed workflow management system developed for INFO-C451 System Implementation.

This version of the project represents **Vertical Slice 1**. The documentation describes the functionality, database implementation, and use cases included in this vertical slice. Additional functionality may be implemented in subsequent vertical slices. 

----------

**System Name:** All Things HR
**Authors:** Team Bravo
**Date:** 9/24/2026
**Course:** INFO-C451 Fall 2026

----------

## Version / Revision History

| Date | Version | Note |
|---|---|---|
| 9/24/26 | 1.0.0 | Vertical Slice 1 |
| 10/4/26 | 1.1.0 | Front-End structure added | 
       
### Version 1.0.0 Summary

Version 1.0.0 represents **Vertical Slice 1** of the All Things HR system. This release establishes the initial database schema, referential integrity constraints, demonstration data, and the application components required to support the use cases included in this vertical slice. 


----------
## Table of Contents
1. [Introduction & Summary](#1-introduction--summary)
   - [1.1 Project Structure](#11-project-structure)
   - [1.2 Team Members](#12-team-members)
   - [1.3 Project Scope](#13-project-scope)
2. [Installation and Setup](#2-installation-and-setup)
   - [2.1 Required Software](#21-required-software)
   - [2.2 Database Setup](#22-database-setup)
   - [2.3 Environment Configuration](#23-environment-configuration)
   - [2.4 Install Dependencies](#24-install-dependencies)
   - [2.5 Start the Back End](#25-start-the-back-end)
   - [2.6 Start the User Interface](#26-start-the-user-interface)
3. [Entities, Attributes, and Relationships](#3-entities-attributes-and-relationships)
4. [Key Use Cases & Queries](#4-key-use-cases--queries)
   - [4.1 Use Case 1](#41-use-case-1)
   - [4.2 Use Case 2](#42-use-case-2)
   - [4.3 Use Case 3](#43-use-case-3)
5. [Front-End Element ID Reference](#5-front-end-element-id-reference)
    - [5.1 Page and Card Layout](#51-page-and-card-layout)
    - [5.2 Form Layout](#52-form-layout) 
    - [5.3 History Layout](#53-history-layout)
    - [5.4 Class and ID Usage](#54-class-and-id-usage)
6. [Front-End Structure](#6-front-end-structure)
    - [6.1 Directory Structure](#61-directory-structure)
    - [6.2 Front-End Components](#62-front-end-components)
    - [6.3 Page Loading](#63-page-loading) 
    - [6.4 Shared Navigation](#64-shared-navigation)
    - [6.5 Shared Utilities](#65-shared-utilities)
    - [6.6 Shared APIs](#66-shared-apis)


----------
## 1. Introduction & Summary 

### 1.1 Project Structure

- 'frontend/' - User interface files
- 'backend/' - Server-side application files
- 'database/' - Database implementation files
- 'documents/' - Supporting project documentation

### 1.2 Team
- Amber Baker
- Amma Mensah-Dwumfua
- Drew Busz
- Titus Duncan

### 1.3 Project Scope: 

----------
## 2. Installation and Setup

### 2.1 Required Software

The following software is required to configure and run the application:

- MariaDB Server
- HeidiSQL
- Node.js
- npm
- Modern web browser

### 2.2 Database Configuration

1. Install and start MariaDB Server.
2. Open HeidiSQL and connect to the local MariaDB server.
3. Run `database/schema.sql` to create the database, tables, views and constraints.
4. Run `database/seed.sql` to populate the database with demonstration data.

### 2.3 Environment Configuration

From the backend directory, copy `.env.example` to `.env`, then configure the local MariaDB environment variables with your local database host, port, username, and password.

Example:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=all_things_hr
PORT=3000
```

The `.env` file should not be committed to the repository because it may contain database credentials.

### 2.4 Install Dependencies

Open a terminal in the project directory and run:

```bash
cd backend
npm install
```

This installs the Node.js dependencies defined in `package.json`.

### 2.5 Start the Back End

From the backend directory, start the Node.js/Express server with:

```bash
npm start
```

The MariaDB service must be running before starting the application.

### 2.6 Start the User Interface

After the back-end server has started, open a modern web browser and navigate to:

```text
http://localhost:3000
```

The browser communicates with the Node.js/Express server, which handles communication with the MariaDB database.

----------
## 3. Entities, Attributes and Relationships: 

### Entities, Attributes, and Relationships
### Entity: Request
- Attribute: request_id (PK, bigint)
- Attribute: request_type_id (FK, bigint)
- Attribute: employee_id (FK, bigint)
- Attribute: assigned_emp_id (FK, bigint)
- Attribute: current_step_id (FK, bigint)
- Attribute: submission_date (timestamp)
- Attribute: priority_level (enum: high, medium, low)
- Attribute: expected_completion (date)
- Attribute: brief_summary (longtext)
- Attribute: confidentiality_level (enum: Nonconfidential, Confidential, Highly Confidential)
- Attribute: intake_source (enum: self_service, email_service)
- Relationship: Categorized As > Request_Type
- Relationship: Submitted By > Employee
- Relationship: Assigned To > Employee
- Relationship: Currently At > Workflow_Step
- Relationship: Has > Request_Field_Value
- Relationship: Has > Request_Notes
- Relationship: Has > Request_History
- Relationship: Has > Approval
- Relationship: Has > Request_Auth

### Entity: Request_Type
- Attribute: request_type_id (PK, bigint)
- Attribute: name (varchar)
- Attribute: is_active (bool)
- Attribute: description (longtext)
- Attribute: approval_required (bool)
- Relationship: Categorizes > Request
- Relationship: Defines > Workflow_Step
- Relationship: Defines > Request_Type_Field
- Relationship: Has > Request_Type_Auth

### Entity: Workflow_Step
- Attribute: workflow_step_id (PK, bigint)
- Attribute: request_type_id (FK, bigint)
- Attribute: step_name (varchar)
- Attribute: step_num (int)
- Attribute: step_code (enum: hr_process, approval, qc, complete)
- Attribute: is_active (bool)
- Relationship: Defined For > Request_Type
- Relationship: Current Step For > Request

### Entity: Request_Type_Field
- Attribute: field_id (PK, bigint)
- Attribute: request_type_id (FK, bigint)
- Attribute: field_name (varchar)
- Attribute: field_label (varchar)
- Attribute: field_type (varchar)
- Attribute: is_required (bool)
- Attribute: display_order (int)
- Relationship: Defined For > Request_Type
- Relationship: Has Values > Request_Field_Value

### Entity: Request_Field_Value
- Attribute: field_id (PK, FK, bigint)
- Attribute: request_id (PK, FK, bigint)
- Attribute: field_val (varchar)
- Attribute: value_date (timestamp)
- Relationship: Value For > Request_Type_Field
- Relationship: Belongs To > Request

### Entity: Request_Notes
- Attribute: request_note_id (PK, bigint)
- Attribute: request_id (FK, bigint)
- Attribute: created_by_emp_id (FK, bigint)
- Attribute: note (longtext)
- Attribute: note_date (timestamp)
- Relationship: Belongs To > Request
- Relationship: Created By > Employee

### Entity: Request_History
- Attribute: request_history_id (PK, bigint)
- Attribute: request_id (FK, bigint)
- Attribute: created_by_emp_id (FK, bigint)
- Attribute: type (enum: created, updated, deleted)
- Attribute: modified_field (varchar)
- Attribute: previous_value (varchar)
- Attribute: current_value (varchar)
- Attribute: date_modified (timestamp)
- Relationship: Tracks > Request
- Relationship: Created By > Employee

### Entity: Approval
- Attribute: approval_id (PK, bigint)
- Attribute: request_id (FK, bigint)
- Attribute: approving_emp_id (FK, bigint)
- Attribute: submission_date (timestamp)
- Attribute: summary (longtext)
- Attribute: decision (enum: approved, denied, deferred)
- Attribute: decision_date (timestamp)
- Relationship: Applies To > Request
- Relationship: Approved By > Employee

### Entity: Employee
- Attribute: employee_id (PK, bigint)
- Attribute: manager_id (FK, bigint)
- Attribute: department_id (FK, bigint)
- Attribute: first_name (varchar)
- Attribute: last_name (varchar)
- Attribute: title (varchar)
- Attribute: start_date (timestamp)
- Attribute: status (enum: active, inactive)
- Attribute: email_address (varchar)
- Relationship: Belongs To > Department
- Relationship: Reports To > Employee
- Relationship: Manages > Employee
- Relationship: Submits > Request
- Relationship: Assigned To > Request
- Relationship: Creates > Request_Notes
- Relationship: Participates In > Approval
- Relationship: Has > Employee_History
- Relationship: Has > Authorization
- Relationship: Has > Request_Auth

### Entity: Employee_History
- Attribute: employee_history_id (PK, bigint)
- Attribute: employee_id (FK, bigint)
- Attribute: modified_by_employee_id (FK, bigint)
- Attribute: type (enum: created, updated, deleted)
- Attribute: modified_field (varchar)
- Attribute: previous_value (varchar)
- Attribute: current_value (varchar)
- Attribute: date_modified (timestamp)
- Relationship: Tracks > Employee
- Relationship: Modified By > Employee


### Entity: Department
- Attribute: department_id (PK, bigint)
- Attribute: manager_id (FK, bigint)
- Attribute: dept_name (varchar)
- Attribute: is_active (bool)
- Relationship: Contains > Employee
- Relationship: Managed By > Employee

### Entity: Authorization
- Attribute: auth_id (PK, bigint)
- Attribute: auth_type_id (FK, bigint)
- Attribute: employee_id (FK, bigint)
- Attribute: authorized_by_id (FK, bigint)
- Attribute: auth_reason (varchar)
- Attribute: effective_date (timestamp)
- Attribute: expiration_date (date)
- Attribute: is_active (boolean)
- Relationship: Has > Authorization_Types
- Relationship: Granted To > Employee
- Relationship: Authorized By > Employee
- Relationship: Applied Through > Request_Auth

### Entity: Authorization_Type
- Attribute: auth_type_id (PK, bigint)
- Attribute: auth_type_name (enum: view only, modification, approval, full access)
- Attribute: description (varchar)
- Attribute: can_view (boolean)
- Attribute: can_update (boolean)
- Attribute: can_approve (boolean)
- Attribute: is_active (boolean)
- Attribute: created_on (timestamp)
- Relationship: Defines > Authorization
- Relationship: Assigned To > Request_Type_Auth

### Entity: Request_Auth
- Attribute: request_auth_id (PK, bigint)
- Attribute: request_id (FK, bigint)
- Attribute: employee_id (FK, bigint)
- Attribute: auth_id (FK, bigint)
- Attribute: effective_date (timestamp)
- Attribute: expiration_date (timestamp)
- Attribute: is_active (bool)
- Relationship: Applies To > Request
- Relationship: Granted To > Employee
- Relationship: Uses > Authorization

### Entity: Request_Type_Auth
- Attribute: request_type_auth_id (PK, bigint)
- Attribute: request_type_id (FK, bigint)
- Attribute: auth_type_id (FK, bigint)
- Attribute: effective_date (timestamp)
- Attribute: expiration_date (timestamp)
- Attribute: is_active (bool)
- Relationship: Applies To > Request_Type
- Relationship: Uses > Authorization_Types


-------


## 4 Key Use Cases & Queries

### Use Case Objectives, Assumptions, Expected Output

#### UC-4: Process and update HR request

**Objective:**
Allow an HR staff member to retrieve an assigned HR request, review its information, record processing notes, update the request's workflow status, and maintain a history of changes made to the request. 

**Assumptions:**
- The HR staff member already exists in the 'employee' table. 
- The request already exists in the 'request' table. 
- The request is assigned to the HR staff member through 'assigned_emp_id'. 
- The HR staff member has the authorization required to process the request. 
- The applicable workflow steps already exist in 'workflow_step'. 
- Input received by the back end has been validated before database operations are performed. 

**Expected Output:** 
The assigned request and its associated information are available to the HR staff member. As the request is processed, new notes are stored in 'request_notes', changes to the request are recorded in 'request_history', and 'current_step_id' is updated to reflect the request's current position in the workflow. When processing is complete, the request is moved to the workflow step identified by the 'complete' step code. 

**Query 1 - Retrieve an assigned request.:**
```sql
SELECT
            r.request_id,
            r.submission_date,
            r.employee_id,
            r.request_type_id,
            r.assigned_emp_id,
            r.current_step_id,
            r.priority_level,
            r.confidentiality_level,
            r.intake_source,
            r.expected_completion,
            r.brief_summary,

            rt.name AS request_type,

            ws.step_name AS status,
            ws.step_code AS status_code,
            ws.step_num AS current_step_num

        FROM request r

        INNER JOIN request_type rt
            ON r.request_type_id = rt.request_type_id

        LEFT JOIN workflow_step ws
            ON r.current_step_id = ws.workflow_step_id

        WHERE r.request_id = ?
          AND r.assigned_emp_id = ?; 
```

The first parameter identifies the request being opened. The second identifies the logged-in HR employee. This prevents the query from returning the request unless it is assigned to that employee. 

**Query 2 - Retrieve the request's configurable field values:**
```sql
SELECT 
    rtf.field_label, 
    rtf.field_type, 
    rfv.field_val 
FROM request_field_value rfv
JOIN request_type_field rtf
    ON rfv.field_id = rtf.field_id
WHERE rfv.request_id = ?
ORDER BY rtf.display_order;
```

**Query 3 - Identify the next workflow step:** 
```sql
SELECT
    workflow_step_id, 
    request_type_id, 
    step_num, 
    step_name, 
    step_code, 
    is_active
FROM workflow_step
WHERE request_type_id = ?
    AND step_num = ?
    AND is_active = TRUE 
LIMIT 1; 
```

**Query 4 — Update the request's current workflow step:**

```sql
UPDATE request
SET current_step_id = ?
WHERE request_id = ?
    AND assigned_emp_id = ?;
```

**Query 6 — Record the workflow step change in request history:**

```sql
INSERT INTO request_history (
    request_id,
    modified_by_employee_id,
    type,
    modified_field,
    previous_value,
    current_value, 
    type
)
VALUES (
    ?,
    ?,
    'updated',
    ?,
    ?,
    'current_step_id',
);
```
-------

## 5 Front-End Element Class and ID Reference

The application uses reusable CSS classes to maintain consistent styling, layout, and responsive behavior across dynamically generated pages. Page modules should apply the following classes when creating interface elements.

Element IDs documented in this section correspond to IDs that have styles defined in the application stylesheet. Other IDs may still be assigned to elements when required by JavaScript, even when those IDs do not have associated CSS rules.

### 5.1 Application Header and Navigation

| Element Class | Typical Element | Purpose |
|---|---|---|
| `.site-header` | `<header>` | Styles the application header with the primary navigation background, text color, and spacing. |
| `.navbar` | `<nav>` or `<div>` | Arranges navigation content horizontally and separates the application title from navigation controls. |
| `.navbar-header` | `<h1>` | Styles the primary heading displayed within the navigation bar. |
| `.menu-toggle` | `<button>` | Styles the hamburger-menu toggle button. |
| `.hamburger-menu` | `<div>` or `<nav>` | Defines the dropdown navigation menu displayed below the application header. |
| `.active` | Hamburger-menu modifier | Displays the hamburger menu when applied together with `.hamburger-menu`. |

The `.hamburger-menu` is hidden by default. Applying the `.active` class changes the menu to a vertically arranged flex container.

Example:

```html
<header class="site-header">
    <nav class="navbar">
        <h1 class="navbar-header">HR Request Management</h1>

        <button class="menu-toggle">
            <span></span>
            <span></span>
            <span></span>
        </button>
    </nav>

    <div class="hamburger-menu">
        <button>Requests</button>
        <button>Employees</button>
    </div>
</header>
```

---

### 5.2 Page and Card Layout

| Element Class / ID | Typical Element | Purpose |
|---|---|---|
| `.card` | `<div>` or `<section>` | Creates a visually grouped content card with a white background, border, spacing, and rounded corners. |
| `.card-row` | `<div>` | Creates a responsive grid for displaying groups of static information. |
| `.card-left` | `<div>` or other grid item | Aligns a card element to the left side of its grid area. |
| `.card-right` | `<div>` or other grid item | Aligns a card element to the right side of its grid area. |
| `.info-item` | `<div>` | Groups a related label and display value within a card row. |
| `.info-label` | `<span>` | Formats the label associated with a static information value. |
| `.info-value` | `<span>` | Formats a static value displayed to the user. |
| `#contentArea` | Application content container | Ensures sections dynamically loaded into the application's content area use the full available width. |
| `#card-header` | Card or page heading element | Styles a primary card heading with application colors, spacing, and a bottom border. |

A `.card-row` displays four columns on larger screens, two columns when the viewport is 900 pixels or less, and one column when the viewport is 650 pixels or less.

Example:

```html
<div class="card">
    <h3>Request Information</h3>

    <div class="card-row">
        <div class="info-item">
            <span class="info-label">
                Request ID
            </span>

            <span class="info-value">
                1001
            </span>
        </div>
    </div>
</div>
```

---

### 5.3 General Form Layout

| Element Class | Typical Element | Purpose |
|---|---|---|
| `.form-grid` | `<div>` | Creates a responsive grid for editable form fields. |
| `.form-field` | `<div>` | Groups a form label with its associated input, select, or textarea. |
| `.full-width` | `.form-field` modifier | Causes a form field to span all four columns of the standard form grid. |

The `.form-grid` uses four columns on larger screens and changes to a single-column layout when the viewport is 650 pixels or less.

Elements placed inside `.form-field` receive consistent label spacing and consistent styling for `<input>`, `<select>`, and `<textarea>` controls.

Example:

```html
<div class="card">
    <h3>Request Details</h3>

    <div class="form-grid">
        <div class="form-field full-width">
            <label for="request-summary">
                Summary
            </label>

            <textarea id="request-summary"></textarea>
        </div>

        <div class="form-field">
            <label for="request-priority">
                Priority
            </label>

            <select id="request-priority">
                ...
            </select>
        </div>
    </div>
</div>
```

---

### 5.4 Process Request Form Layout

The Process Request page uses additional layout classes to support a two-column form design.

| Element Class | Typical Element | Purpose |
|---|---|---|
| `.process-form-layout` | `<div>` | Creates the main two-column layout used by the Process Request form. |
| `.form-column` | `<div>` | Arranges related form controls vertically within a Process Request form column. |
| `.summary-field` | `.form-field` modifier or wrapper | Provides additional sizing behavior for the request summary textarea. |
| `.form-actions` | `<div>` | Contains form action buttons and aligns them to the right side of the form. |

The `.process-form-layout` uses two columns on larger screens, with approximately one-third of the available space assigned to the first column and two-thirds assigned to the second column.

At viewport widths of 750 pixels or less, the layout changes to a single column. Form-action buttons also expand to the full available width.

The textarea contained within `.summary-field` has a minimum height of 250 pixels on larger screens and 100 pixels on smaller screens.

Example:

```html
<form>
    <div class="process-form-layout">

        <div class="form-column">
            <div class="form-field">
                <label for="request-priority">
                    Priority
                </label>

                <select id="request-priority">
                    ...
                </select>
            </div>
        </div>

        <div class="form-column">
            <div class="form-field summary-field">
                <label for="request-summary">
                    Summary
                </label>

                <textarea id="request-summary"></textarea>
            </div>
        </div>

    </div>

    <div class="form-actions">
        <button type="submit">
            Update Request
        </button>
    </div>
</form>
```

---

### 5.5 History Layout

| Element Class | Typical Element | Purpose |
|---|---|---|
| `.history-header` | `<div>` | Defines the column headings displayed above history records. |
| `.history-item` | `<div>` | Represents an individual request-history record using the history grid layout. |
| `.history-date` | `<span>` | Displays the date associated with a history record. |
| `.history-field` | `<span>` | Identifies the request field that was changed. |
| `.history-change` | `<span>` or `<div>` | Displays the value or description of the recorded change and allows long content to wrap. |
| `.history-empty` | `<p>` | Styles the message displayed when no request-history records are available. |

The history layout normally uses four columns:

1. Date
2. Changed field
3. Additional history information
4. Change description

At viewport widths of 750 pixels or less, `.history-header` is hidden and each `.history-item` changes to a single-column layout for easier viewing on smaller screens.

Example:

```html
<div class="card">
    <h3>Request History</h3>

    <div class="history-header">
        <span>Date</span>
        <span>Field</span>
        <span>Updated By</span>
        <span>Change</span>
    </div>

    <div class="history-item">
        <span class="history-date">
            10/04/2026
        </span>

        <span class="history-field">
            Priority
        </span>

        <span>
            Employee 100
        </span>

        <span class="history-change">
            Medium → High
        </span>
    </div>
</div>
```

When no history exists, the `.history-empty` class may be used:

```html
<p class="history-empty">
    No request history is available.
</p>
```

---

### 5.6 Form Actions and Messages

Form submit buttons receive common styling automatically through the `form button[type="submit"]` CSS selector. A separate button class is therefore not required for standard submit buttons.

Buttons contained within `.form-actions` receive similar styling and are positioned according to the Process Request layout.

The stylesheet also defines the following message element:

| Element ID | Typical Element | Purpose |
|---|---|---|
| `#request-message` | `<p>`, `<div>`, or `<span>` | Displays status, success, or error information associated with request form operations. |

Example:

```html
<form>
    ...

    <button type="submit">
        Save Request
    </button>

    <p id="request-message"></p>
</form>
```

---

### 5.7 Responsive Behavior

The application stylesheet defines several responsive breakpoints to ensure that pages remain usable on smaller screens.

At **900 pixels or less**, `.card-row` changes from four columns to two columns.

At **750 pixels or less**:

- `.process-form-layout` changes from two columns to one column.
- `.summary-field textarea` reduces its minimum height.
- `.form-actions button` expands to the full available width.
- `.history-header` is hidden.
- `.history-item` changes to a single-column layout.

At **650 pixels or less**:

- The `<main>` content area expands to use the available screen width with reduced horizontal padding.
- `.site-header` uses reduced padding.
- `.hamburger-menu` expands to the full screen width and removes its rounded corners.
- `.card-row` changes to a single-column layout.
- `.form-grid` changes to a single-column layout.
- `.history-item` remains in a single-column layout.

---

### 5.8 Class and ID Usage

CSS classes are used for reusable styling and layout. Multiple elements may use the same class across different application pages.

Element IDs identify individual elements that require unique styling or JavaScript access. The stylesheet currently defines styles for the following application IDs:

- `#contentArea` identifies the application's dynamically populated content container.
- `#card-header` identifies a primary heading or header element used within application content.
- `#request-message` identifies the message area used to display request form feedback.

Additional IDs may be assigned to form controls, forms, navigation elements, or other components when JavaScript needs to uniquely identify them. An ID does not need to have a corresponding CSS rule in order to be used by JavaScript.

In general, **classes define reusable presentation and layout behavior, while IDs identify individual elements that require unique styling or JavaScript interaction.**
## 6 Front-End Structure 

The front end uses a modular JavaScript structure to separate applicaiton initialization, page routing, navigation configuration, page-specific functionality, shared utilities, and styling. 

The application uses `index.html` as the persistent interface shell. Individual pages are generated dynamically with JavaScript and loaded into the content area without requiring a separate HTML file for each page. 

### 6.1 Directory Structure 

```text
frontend/
├── README.md
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js
    ├── navigation.js
    ├── router.js
    ├── pages/
    │   ├── processingHomePage.js
    │   ├── processRequestPage.js
    │   └── newRequestPage.js
    └── utils/
        ├── dateHelper.js
        └── testFormatHelper.js
```
______
### 6.2 Front-End Components 

| Component | Responsibility |
|---|---|
| `index.html` | Defines the persistent application shell, including the header, hamburger menu, and main content area. |
| `css/styles.css` | Contains shared application styling, responsive layouts, navigation styling, cards, forms, and other reusable presentation rules. |
| `js/app.js` | Initializes the front end and manages application-level behavior, including navigation events. |
| `js/navigation.js` | Defines and renders the header title and hamburger-menu options appropriate for each area of the application. |
| `js/router.js` | Controls front-end page routing and determines which page module should be loaded based on the user's current workflow. |
| `js/pages/` | Contains page-specific modules responsible for rendering individual application views and implementing page-specific behavior. |
| `js/utils/` | Contains reusable helper functions that are shared by multiple page modules, such as date-formatting functions. |
| `js/api/` | Contains reusable modules that allow the front end to interact with the back end API endpoints. | 
______
### 6.3 Page Loading 

The front end does not use a separate HTML document fo reach application page. Instead, `index.html` provides a persistent content container: 

```html 
<main id="main_content">  
    <div id="contentArea"></div> 
</main>
```

When navigation or another user action requires a different page, the application calls the `loadPage()` function in `router.js`. The router selects the appropriate page module and passes any required contextual data, such as request ID. 

For example: 

 ```javascript 
 loadPage(
    "process-request", 
    requestId, 
    actingEmployeeId
); 
 ```

 The router then invokes the corresponding page-loading function: 
 ```javascript 
 case "process-request": 
    loadNavigation("processing"); 

    loadProcessRequestPage(
        requestId, 
        actingEmployeeId
    );
    break; 
 ```

 The page module dynamically generates its interface and inserts it into `contentArea`. 
______
### 6.4 Shared Navigation 

`navigation.js` manages the shared header and hamburger-menu configuaration for the different areas of the application. This allows employee, HR processing, and manager pages to display navigation options appropriate to their application context without duplicating navigation markup across individual page modules. 

______
### 6.5 Shared Utilities 

Reusable functiosn that are not specific to an individual page are stored in `js/utils/`. For example, date-formatting fucntions used by multiple pages are maintained in `dateHelper.js` and imported where required. 

This modular structure reduces duplicated code and separates shared application behavior from page-specific functionality. 
______
### 6.6 Shared APIs

The `js/api/requestApi.js` module provides the client-side interface for communicating with the application's request-related API endpoints.