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
| 10/11/26| 1.1.0 | Vertical Slice 2 |  

----------
### Version 1.0.0 Summary

Version 1.0.0 represents **Vertical Slice 1** of the All Things HR system. This release establishes the initial database schema, referential integrity constraints, demonstration data, and the application components required to support the use cases included in this vertical slice. 

----------
### Version 1.1.0 Summary

Version 1.1.0 represents **Vertical Slice 2** of the All Things HR system. This revision expands the implementation documentation for UC-3 and UC-4, adds implementation progress summaries for Vertical Slices 1 and 2, and updates the key use case definitions to reflect the current assignment and request-processing workflows.

The front-end documentation was also revised to better describe the application's reusable card, form, list, and history structures. The Front-End Structure section was expanded to document the current directory organization, page loading, workspace selection, shared navigation, shared utilities, and reusable API modules.

The table of contents and version history were updated to reflect the revised section structure and newly added documentation.

----------
## Table of Contents
1. [Introduction & Summary](#1-introduction--summary)  
   - [1.1 Project Structure](#11-project-structure)  
   - [1.2 Team Members](#12-team-members)  
   - [1.3 Implementation Progress](#13-implementation-progress)  
     - [1.3.1 Vertical Slice 1](#131-vertical-slice-1)  
     - [1.3.2 Vertical Slice 2](#132-vertical-slice-2)  
2. [Installation and Setup](#2-installation-and-setup)
   - [2.1 Required Software](#21-required-software)
   - [2.2 Database Setup](#22-database-setup)
   - [2.3 Environment Configuration](#23-environment-configuration)
   - [2.4 Install Dependencies](#24-install-dependencies)
   - [2.5 Start the Back End](#25-start-the-back-end)
   - [2.6 Start the User Interface](#26-start-the-user-interface)
3. [Entities, Attributes, and Relationships](#3-entities-attributes-and-relationships)
4. [Key Use Cases](#4-key-use-cases)  
   - [4.1 UC-4: Process and Update HR Request](#41-uc-4-process-and-update-hr-request)  
   - [4.2 UC-3: Assign an HR Request](#42-uc-3-assign-an-hr-request)
5. [Front-End Element and Styling Reference](#5-front-end-element-and-styling-reference)
   - [5.1 Page and Card Layout](#51-page-and-card-layout)
   - [5.2 Form Layout](#52-form-layout)
   - [5.3 List and History Layout](#53-list-and-history-layout)
   - [5.4 Responsive, Class, and ID Usage](#54-responsive-class-and-id-usage)
6. [Front-End Structure](#6-front-end-structure)
   - [6.1 Directory Structure](#61-directory-structure)
   - [6.2 Front-End Components](#62-front-end-components)
   - [6.3 Page Loading](#63-page-loading)
   - [6.4 Workspace Selection](#64-workspace-selection)
   - [6.5 Shared Navigation](#65-shared-navigation)
   - [6.6 Shared Utilities](#66-shared-utilities)
   - [6.7 Shared APIs](#67-shared-apis)


----------
## 1 Introduction & Summary 

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

### 1.3 Implementation Progress 

#### 1.3.1 Vertical Slice 1 (Assignment 4)

**Working End-to-End Functionality:**  
Vertical Slice 1 established an end-to-end implementation of the selected UC-4 workflow. An HR staff member could retrieve an assigned request, update its workflow status through the user interface, and submit the change to the back end. The back end validated the submitted change, updated the request in MariaDB, recorded the modification in `request_history`, and returned the updated request. The updated workflow status remained persisted after the request was refreshed.

**Partially Implemented Requirements and Use Cases:**  
UC-4 was only partially implemented during Vertical Slice 1. The completed functionality supported viewing an assigned request and updating its workflow status. Additional UC-4 functionality, including request notes, requests for additional information, notifications, and final resolution, remained to be implemented in later vertical slices.

The proposed authorization layer was also not yet implemented. As a temporary validation measure, the request retrieval and update logic restricted access using the assigned employee identifier. The SQL condition `AND assigned_emp_id = ?` was used to ensure that only the HR staff member assigned to the request could retrieve or modify it.

Future iterations were planned to replace this temporary restriction with the project’s authorization layer, including role-based and request-specific permission checks.

----------
#### 1.3.2 Vertical Slice 2 (Assignment 5)

**Major Functionality Completed:**  
Vertical Slice 2 expands the application to support two primary HR request workflows. HR staff can retrieve requests assigned to them, review request information and history, update permitted request details, advance requests through valid workflow steps, and persist those changes in MariaDB.

Within the HR Processing workflow, confidentiality level is displayed as read-only. Authorized HR Staff can also review unassigned requests and assign them to eligible HR staff members. Submitted changes are validated by the back end before being persisted, and modified request values are recorded in `request_history`.

**Partially Implemented or Remaining Functionality:**  
Several planned features remain incomplete, including request notes, additional request-specific field handling, approval workflows, notifications, Highly Confidential visibility controls, employee self-service request submission, and simulated email intake.

The authorization model is also still being expanded to support the full set of role-specific permissions defined in the requirements. Remaining authorization work includes confidentiality management for Authorized HR Staff and additional Highly Confidential permissions for HR Managers.

----------
## 2 Installation and Setup

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

From the directory, copy `/backend/.env.example` to `backend/.env`, then configure the local MariaDB environment variables with your local database host, port, username, and password.

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
## 3 Entities, Attributes and Relationships: 

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


## 4 Key Use Cases
### 4.1 UC-4: Process and update HR request

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

-------

### 4.2 UC-3: Assign an HR Request

**Objective:**  
Allow an Authorized HR Staff member to review unassigned HR requests, select a request, and assign it to an eligible HR staff member for processing.

**Assumptions:**
- The request already exists in the `request` table and is currently unassigned.
- The acting employee exists in the `employee` table and has the authorization required to assign requests.
- The selected assignee exists in the `employee` table and is authorized to process HR requests.
- Eligible employees can be retrieved through the application data-access layer.
- Assignment values are validated by the back end before database changes are performed.

**Expected Output:**  
The Authorized HR Staff member can view unassigned requests, open a selected request, and choose an eligible HR staff member as the assignee. Priority and expected completion date may also be set as part of the assignment process.

When **Save Assignment** is selected, the application sends the assignment information to the back end for validation. The acting employee and selected assignee are validated against the required authorization before the assignment is saved.

After validation succeeds, the request is updated in MariaDB within a database transaction. The selected employee is stored in `assigned_emp_id`, and any additional changed request values are also persisted. Each modified field is recorded in `request_history`, including the employee responsible for the change, the previous value, and the updated value.

After the assignment is completed, the request is no longer returned as unassigned and becomes available in the selected employee's assigned-request list.

-------

## 5 Front-End Element and Styling Reference

The front end uses a small set of reusable CSS layout patterns so dynamically generated pages have a consistent structure. Rather than defining a separate layout for each page, page modules build their interfaces from shared cards, information rows, forms, list items, history records, navigation elements, and feedback messages.

The classes described below define the general structure of those elements. Individual pages may use additional IDs or classes when JavaScript needs to identify a specific control or apply page-specific behavior.

### 5.1 Page and Card Layout

Cards provide the primary structure for grouping related content. A `.card` creates a bordered content section, while `.card-row` can be used inside a card to organize related information into a responsive grid. Individual values are commonly grouped with `.info-item`, `.info-label`, and `.info-value` so static information is displayed as consistent label-value pairs.

The application header and navigation provide the persistent structure surrounding the page content. The header contains the application title, workspace controls, and hamburger navigation, while `#contentArea` serves as the container where page modules dynamically insert the current page.

Example:

```html
<div class="card">
    <h3>Request Information</h3>

    <div class="card-row">
        <div class="info-item">
            <span class="info-label">Request ID</span>
            <span class="info-value">1001</span>
        </div>

        <div class="info-item">
            <span class="info-label">Priority</span>
            <span class="info-value">High</span>
        </div>
    </div>
</div>
```

The same card pattern is also used for request lists. Assigned and unassigned requests are presented as card-based items containing a request title, grouped details, and an action or assignment control.

---

### 5.2 Form Layout

Forms use shared field and grid structures so editable content follows the same layout conventions as static cards. `.form-field` groups a label with its input, select, or textarea, while `.form-grid` arranges multiple fields in a responsive grid. Fields that require additional space can use the `.full-width` modifier.

Pages that require a more specialized form can use `.process-form-layout` and `.form-column` to divide the form into logical sections. `.form-actions` provides a consistent location for submit or update controls, and summary textareas can use `.summary-field` when additional vertical space is needed.

Example:

```html
<form class="card">
    <h3>Request Details</h3>

    <div class="form-grid">
        <div class="form-field">
            <label for="request-priority">Priority</label>
            <select id="request-priority">
                ...
            </select>
        </div>

        <div class="form-field full-width">
            <label for="request-summary">Summary</label>
            <textarea id="request-summary"></textarea>
        </div>
    </div>

    <div class="form-actions">
        <button type="submit">Save Request</button>
    </div>
</form>
```

---

### 5.3 List and History Layout

Request lists use card-based list items so each request can display a title, several related details, and an available action. Detail values are grouped as label-value pairs so assigned and unassigned request pages follow the same general visual structure as other application cards.

Request history uses a separate grid structure. `.history-header` defines the column headings and each `.history-item` represents one history record. Supporting classes identify values such as the date, changed field, and change description. When no history exists, a simple empty-state message can be displayed instead.

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
        <span class="history-date">10/04/2026</span>
        <span class="history-field">Priority</span>
        <span>Employee 100</span>
        <span class="history-change">Medium → High</span>
    </div>
</div>
```

Feedback elements, such as request messages and assignment confirmations, are displayed near the related form or list so success and error information remains associated with the action that produced it.

---

### 5.4 Responsive, Class, and ID Usage

The stylesheet uses responsive breakpoints to progressively simplify these shared structures on smaller screens. Multi-column card and form grids collapse toward single-column layouts, process forms stack vertically, history rows become easier to read on narrow screens, and navigation and request-card controls adjust to the available width.

CSS classes should be used for reusable presentation, layout, component states, and responsive behavior. IDs should be reserved for elements that require unique styling or JavaScript interaction, such as the dynamically populated content area or individual form controls.

In general, page modules should build new interfaces by reusing the existing card, form, list, history, navigation, and feedback structures before introducing page-specific styling.

## 6 Front-End Structure 

The front end uses a modular JavaScript structure to separate applicaiton initialization, page routing, navigation configuration, page-specific functionality, shared utilities, and styling. 

The application uses `index.html` as the persistent interface shell. Individual pages are generated dynamically with JavaScript and loaded into the content area without requiring a separate HTML file for each page. 

This structure keeps front-end responsibilities separated in a manner consistent with the layered organization used by the back end.

### 6.1 Directory Structure 

```text
frontend/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js
    ├── navigation.js
    ├── router.js
    ├── api/
    │   ├── employeeApi.js
    │   └── requestApi.js
    ├── pages/
    │   ├── assignRequestPage.js
    │   ├── myAssignedRequestsPage.js
    │   ├── newRequestPage.js (Not implemented)
    │   ├── processingHomePage.js
    │   ├── processRequestPage.js
    │   └── unassignedRequestsPage.js
    └── utils/
        ├── dateHelper.js
        ├── requestRenderHelper.js.js
        └── testFormatHelper.js
```
______
### 6.2 Front-End Components

| Component | Responsibility |
|---|---|
| `index.html` | Defines the persistent application shell, including the header, navigation controls, and main content area. |
| `css/styles.css` | Defines shared application styling, reusable cards and forms, navigation presentation, and responsive layouts. |
| `js/app.js` | Initializes the front end and configures application-level behavior. |
| `js/navigation.js` | Manages shared navigation and header configuration for different application workspaces. |
| `js/router.js` | Controls page routing and determines which page module should be loaded for the requested application view. |
| `js/pages/` | Contains page-specific modules responsible for rendering views and handling page-level user interaction. |
| `js/api/` | Contains reusable functions for communicating with back-end API endpoints. |
| `js/utils/` | Contains reusable formatting and rendering functions shared across multiple page modules. |

______

### 6.3 Page Loading

The front end does not use a separate HTML document for each application page. Instead, `index.html` provides a persistent content container:

```html
<main id="main_content">
    <div id="contentArea"></div>
</main>
```

When navigation or another user action requires a different view, the application calls the `loadPage()` function in `router.js`. The router identifies the appropriate page module and passes any contextual information required by that page.

For example:

```javascript
loadPage(
    "process-request",
    requestId,
    actingEmployeeId
);
```

The router then loads the appropriate navigation configuration and invokes the corresponding page function:

```javascript
case "process-request":
    loadNavigation("processing");

    loadProcessRequestPage(
        requestId,
        actingEmployeeId
    );
    break;
```

The page module generates the required interface and inserts it into `contentArea`, replacing the previously displayed page content.

______

### 6.4 Workspace Selection

The application includes a workspace selector in the persistent header to support testing across different application contexts.

```html 
<div class="workspace-control">
    <label for="workspace-select">Workspace</label>

    <select id="workspace-select" aria-label="Select workspace">
        <option value="processing">HR Processing</option>
        <option value="authorized_staff">Authorized Staff</option>
        <option value="employee">Employee</option>
        <option value="manager">Management</option>
    </select>
</div>
```

The workspace selector is a testing feature that allows the user to easily switch between HR Processing, Authorized Staff, Employee, and Management workspaces without requiring separate authentication or test accounts.

Workspace selection is independent of page navigation. Changing the selected workspace updates the application context and corresponding navigation options, while page navigation determines which page is displayed within that workspace.

This control is intended to simplify development and testing of workspace-specific functionality and does not represent the final authorization or user-role selection process.
______

### 6.5 Shared Navigation

`navigation.js` manages the shared application header and hamburger-menu configuration.

Navigation options are selected according to the current application workspace, allowing HR Processing, Authorized Staff, Employee, and Management views to use the same navigation structure without duplicating navigation markup within individual page modules.

The workspace selector determines the active workspace context, while the navigation controls allow movement between pages available within that workspace. The router and navigation modules work together so that the displayed navigation remains consistent with the currently selected workspace and page.

______

### 6.6 Shared Utilities

Reusable functions that are not specific to a single page are stored in `js/utils/`.

For example, `dateHelper.js` provides shared date-formatting functions, while `requestRenderHelper.js` contains reusable rendering functions for request-related elements that appear on multiple pages.

Keeping these functions separate from page modules reduces duplicated code and allows page modules to remain focused on page-specific behavior.

______

### 6.7 Shared APIs

Modules in `js/api/` provide the client-side interface for communicating with the back-end API.

`requestApi.js` contains reusable functions for request-related operations, while `employeeApi.js` contains reusable functions for retrieving employee-related information.
`employeeApi.js` contains reusable functions for retrieving employee-related information.

Page modules call these API functions rather than defining `fetch()` requests directly. This separates API communication from page rendering and provides a consistent pattern for accessing back-end functionality throughout the front end.