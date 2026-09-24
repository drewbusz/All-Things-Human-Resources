
# All Things HR Inventory Database System 

## Document Summary 
This document outlines the intitial database design for a simple workflow management 
system designed for human resource teams in small to mid-sized businesses. 

----------

**System Name:** All Things HR
**Author:** Amber Baker
**Date:** 9/24/2026
**Course:** INFO-C490 Fall 2026

----------

## Version/Revisions & Date: 
        ---------------------------------------------
        |Date    | Version | Note                   |
        |--------|---------|------------------------|
        |9/24/26 | 1.0.0   | Vertical Slice 1       |
        |--------|---------|------------------------|
       
**Version 1.0.0 Summary** 


----------
## Table of Contents 
1. Introduction & Summary
    1.1 Purpose
    1.2 Project Scope
    1.3 Intended Audience 
2. Entities, Attributes and Relationships
    2.1 Relationship Summary 
3. Key Uses cases & Queries 
    3.1 Use Case Objectives, Assumptions, Expected Output, Query
----------
## Introductin & Summary 

### 1.1 Purpose: 


### 1.2 Project Scope: 


----------
## 2 Entities, Attributes and Relationships: 

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
- Attribute: field_val_id (PK, bigint)
- Attribute: field_id (FK, bigint)
- Attribute: request_id (FK, bigint)
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
- Attribute: emp_history_id (PK, bigint)
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
- Attribute: view (boolean)
- Attribute: update (boolean)
- Attribute: approve (boolean)
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

### Entity: Req_Type_Auth
- Attribute: req_type_auth_id (PK, bigint)
- Attribute: req_type_id (FK, bigint)
- Attribute: auth_type_id (FK, bigint)
- Attribute: effective_date (date)
- Attribute: expiration_date (date)
- Attribute: is_active (bool)
- Relationship: Applies To > Request_Type
- Relationship: Uses > Authorization_Types

-------

## 3 Key Uses cases & Queries 

### Use Case Objectives, Assumptions, Expected Output

#### Use Case 1

**Objective:**
Create a Request submitted by an employee through the structured self-service intake process. 
The request is associated with a request type, initialized at the appropriate workflow step, 
and the intake source is identified as self_service. 

**Assumptions:**
- The submitting employee already exists in the Employee table
- The selected request type already exists in the Request_Type table
- The initial workflow step for this request type exists in Workflow_Step
- The data was validated by the front-end processor before being pushed to the database. 

**Expected Output:** 
One new record is created within the Request table containing the employee's request, 
selected request type, initial workflow step, priority, summary, confidentiality level, 
and self_service intake source. 

**Query 1:** 
SELECT workflow_step_id 
FROM Workflow_Step
WHERE request_type_id = ?
AND is_active = 1 
AND step_num = 1; 


**Query 2:**
INSERT INTO Request (
    request_type_id, 
    employee_id, 
    current_step_id, 
    submission_date, 
    brief_summary, 
    confidentiality_level, 
    intake_source  
)
VALUES ( 
    ?, 
    ?, 
    ?, 
    CURRENT_DATE, 
    ?, 
    ?, 
    'self_service'
);  
**Query 3:**
INSERT INTO Request_Field_Value ( 
    field_id, 
    request_id, 
    field_value, 
    value_date
)
VALUES (
    ?, 
    ?, 
    ?, 
    CURRENT_DATE
); 

**Query 4:**
SELECT 
    rta.auth_type_id, 
    a.auth_id,
    a.employee_id
FROM Req_type_Auth rta
JOIN Authorization a
    ON rta.auth_type_id = a.auth_type_id
WHERE rta.is_active = 1 
AND a.is_active = 1
AND rta.req_type_id = ?; 


**Query 5:**
INSERT INTO Request_Auth (
    request_id, 
    employee_id, 
    auth_id, 
    effective_date, 
    is_active, 
)
VALUES (
    ?, 
    ?, 
    ?, 
    CURRENT_DATE, 
    1, 
); 

-------

#### Use Case 2

**Objective:**


**Assumptions:**


**Expected Output:** 


**Query:**

-------

#### Use Case 3

**Objective:**


**Assumptions:**


**Expected Output:** 


**Query:**
