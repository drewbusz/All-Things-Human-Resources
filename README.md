# All Things Human Resources

All Things Human Resources is a database-backed workflow management system developed for INF-C451 System Implementation.

This version of the project represents **Vertical Slide 1**. The documentation describes the functionality, database implementation, and use cases included in this vertical slice. Additional functionality may be implemented in subsequent vertical slices. 

----------

**System Name:** All Things HR
**Authors:** Team Bravo
**Date:** 9/24/2026
**Course:** INFO-C490 Fall 2026

----------

## Version / Revision History

| Date | Version | Note |
|---|---|---|
| 9/24/26 | 1.0.0 | Vertical Slice 1 |
       
### Version 1.0.0 Summary

Version 1.0.0 represents **Vertical Slice 1** of the All Things HR system. This release establishes the initial database schema, referential integrity constaints, demonstration data, and the application components reuired to suport the use cases included in this vertical slice. 


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
   - [3.1 Relationship Summary](#31-relationship-summary)
4. [Key Use Cases & Queries](#4-key-use-cases--queries)
   - [4.1 Use Case 1](#41-use-case-1)
   - [4.2 Use Case 2](#42-use-case-2)
   - [4.3 Use Case 3](#43-use-case-3)
----------
## Introduction & Summary 

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
## Installation and Setup

## 2. Installation and Setup

### 2.1 Required Software

The following software is required to configure and run the application:

- MariaDB Server
- HeidiSQL
- Node.js
- npm
- Modern web browser

### 2.2 Database Setup

1. Install and start MariaDB Server.
2. Open HeidiSQL and connect to the local MariaDB server.
3. Create the application database.
4. Run `database/schema.sql` to create the database tables and constraints.
5. Run `database/seed.sql` to populate the database with demonstration data.

### 2.3 Environment Configuration

Copy `.env.example` to `.env` and configure the local MariaDB connection information.

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
npm install
```

This installs the Node.js dependencies defined in `package.json`.

### 2.5 Start the Back End

Start the Node.js/Express server with:

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

## Entities, Attributes, and Relationships
### Entity: Request
- Attribute: request_id (PK, bigint)
- Attribute: request_type_id (FK, bigint)
- Attribute: employee_id (FK, bigint)
- Attribute: assigned_emp_id (FK, bigint)
- Attribute: current_step_id (FK, bigint)
- Attribute: submission_date (date)
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
- Relationship: Has > Req_Type_Auth

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
- Attribute: is_active (bool)
- Relationship: Defined For > Request_Type
- Relationship: Has Values > Request_Field_Value

### Entity: Request_Field_Value
- Attribute: field_id (PK, FK, bigint)
- Attribute: request_id (PK, FK, bigint)
- Attribute: field_value (varchar)
- Attribute: value_date (date)
- Relationship: Value For > Request_Type_Field
- Relationship: Belongs To > Request

### Entity: Request_Notes
- Attribute: request_note_id (PK, bigint)
- Attribute: request_id (FK, bigint)
- Attribute: created_by_emp_id (FK, bigint)
- Attribute: note (longtext)
- Attribute: note_date (date)
- Relationship: Belongs To > Request
- Relationship: Created By > Employee

### Entity: Request_History
- Attribute: request_history_id (PK, bigint)
- Attribute: request_id (FK, bigint)
- Attribute: modified_by_employee_id (FK, bigint)
- Attribute: type (enum: created, updated, deleted)
- Attribute: modified_field (varchar)
- Attribute: previous_value (varchar)
- Attribute: current_value (varchar)
- Attribute: date_modified (date)
- Relationship: Tracks > Request
- Relationship: Modified By > Employee

### Entity: Approval
- Attribute: approval_id (PK, bigint)
- Attribute: request_id (FK, bigint)
- Attribute: approving_emp_id (FK, bigint)
- Attribute: requesting_emp_id (FK, bigint)
- Attribute: submission_date (date)
- Attribute: summary (longtext)
- Attribute: decision (enum: approved, denied, deferred)
- Attribute: decision_date (date)
- Relationship: Applies To > Request
- Relationship: Approved By > Employee
- Relationship: Requested By > Employee

### Entity: Employee
- Attribute: employee_id (PK, bigint)
- Attribute: manager_id (FK, bigint)
- Attribute: department_id (FK, bigint)
- Attribute: first_name (varchar)
- Attribute: last_name (varchar)
- Attribute: title (varchar)
- Attribute: start_date (date)
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
- Attribute: date_modified (date)
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
- Attribute: effective_date (date)
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
- Attribute: created_on (date)
- Relationship: Defines > Authorization
- Relationship: Assigned To > Req_Type_Auth

### Entity: Request_Auth
- Attribute: request_auth_id (PK, bigint)
- Attribute: request_id (FK, bigint)
- Attribute: employee_id (FK, bigint)
- Attribute: auth_id (FK, bigint)
- Attribute: effective_date (date)
- Attribute: expiration_date (date)
- Attribute: is_active (bool)
- Relationship: Applies To > Request
- Relationship: Granted To > Employee
- Relationship: Uses > Authorization

### Entity: Request_Type_Auth
- Attribute: request_type_auth_id (PK, bigint)
- Attribute: request_type_id (FK, bigint)
- Attribute: auth_type_id (FK, bigint)
- Attribute: effective_date (date)
- Attribute: expiration_date (date)
- Attribute: is_active (bool)
- Relationship: Applies To > Request_Type
- Relationship: Uses > Authorization_Types


-------


## 4 Key Uses cases & Queries 

### Use Case Objectives, Assumptions, Expected Output

#### UC-4: Process and update HR request

**Objective:**
Allow an HR staff member to retrieve an assigned HR request, review its information, record processing notes, update the request's workflow status, and maintain a history of changes made to the request. 

**Assumptions:**
- The HR staff member already exists in the 'employee' table. 
- The request already exists in the 'request' table. 
- The request is assiigned to the HR staff member through 'assigned_emp_id'. 
- The HR staff member has the authorization required to process the request. 
- The applicable workflow steps already exist in 'workflow_step'. 
- Input received by the back end has been validated before database operatioons are performed. 

**Expected Output:** 
The assigned request and its associated information are available to the HR staff member. As the request is processed, new notes are stored in 'request_notes', changes to the request are recorded in 'request_history', and 'current_step_id' is updated to reflect the request's current position in the workflow. When processing is complete, the request is moved to the workflow step identified by the 'complete' step code. 

**Query 1 - Retrieve an assigned request.:**
```sql
SELECT * 
FROM request_view
WHERE request_id = ?
AND assigned_emp_id = ?; 
```

The first parameter identifies the request being opened. The second identifies the logged-in HR employee. This preseents the query from returning the request unless it is assigned to that employee. 

**Query 2 - Retrieve the request's configurable field values:**
```sql
SELECT 
    rtf.field_label, 
    rtf.field_type, 
    rfv.field_val 
FROM request_field_value rfv
JOIN request_type_field rft
    ON rfv.field_id = rtf.field_id
WHERE rfv.request_id = ?
ORDER BY rft.display_order; 
```

**Query 3 - Add a processing note:**
```sql
INSERT INTO request_notes (
    request_id, 
    created_by_emp_id, 
    note
)
VALUES (
    ?,
    ?,
    ?
);
```
`note_date` is omitted because the database automatically assigned `CURRENT_TIMESTAMP`

**Query 4 - Identify the next workflow step:** 
```sql
SELECT
    workflow_step_id, 
    step_name, 
    step_code
FROM workflow_step
WHERE request_type_id = ?
AND step_num = ?
AND is_active = TRUE; 
```
The application supplies the request type and next workflow step number. 

**Query 5 — Update the request's current workflow step:**

```sql
UPDATE request
SET current_step_id = ?
WHERE request_id = ?
AND assigned_emp_id = ?;
```

This updates the request while also ensuring that the request is assigned to the HR staff member performing the operation.

**Query 6 — Record the workflow change in request history:**

```sql
INSERT INTO request_history (
    request_id,
    modified_by_employee_id,
    type,
    modified_field,
    previous_value,
    current_value
)
VALUES (
    ?,
    ?,
    'updated',
    'current_step_id',
    ?,
    ?
);
```

The previous and new workflow step values are stored so the status change can be audited.

**Query 7 — Resolve the request:**

```sql
SELECT workflow_step_id
FROM workflow_step
WHERE request_type_id = ?
AND step_code = 'complete'
AND is_active = TRUE;
```

After obtaining the appropriate `workflow_step_id`, the request is moved to that step:

```sql
UPDATE request
SET current_step_id = ?
WHERE request_id = ?
AND assigned_emp_id = ?;
```

The corresponding change is then recorded in `request_history`.

-------

#### Use Case 2



-------



#### Use Case 3

**Objective:**


**Assumptions:**


**Expected Output:** 


**Query:**
