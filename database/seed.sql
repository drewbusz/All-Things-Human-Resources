-- ============================================================
-- REQUEST TYPE
-- ============================================================

INSERT INTO request_type (
    name,
    is_active,
    description,
    approval_required
)
VALUES
    (
        'Employee Information Change',
        TRUE,
        'Request to update employee information maintained by Human Resources.',
        FALSE
    ),
    (
        'Leave Request',
        TRUE,
        'Request for employee leave requiring review and approval.',
        TRUE
    ),
    (
        'Benefits Inquiry',
        TRUE,
        'Request for information or assistance related to employee benefits.',
        FALSE
    ),
    (
        'Payroll Correction',
        TRUE,
        'Request to investigate or correct an employee payroll issue.',
        TRUE
    ),
    (
        'Employment Verification',
        TRUE,
        'Request for verification of employee employment information.',
        FALSE
    ),
    (
        'Workplace Accommodation',
        TRUE,
        'Request for review of a workplace accommodation.',
        TRUE
    );


-- ============================================================
-- AUTHORIZATION TYPE
-- ============================================================

INSERT INTO authorization_type (
    description,
    can_view,
    can_update,
    can_approve,
    auth_type_name
)
VALUES
    -- ORIGINAL ROWS
    (
        'Employee can view their own request submissions.',
        TRUE,
        FALSE,
        FALSE,
        'view only'
    ),
    (
        'Manager can view request submissions from employees within their department.',
        TRUE,
        FALSE,
        FALSE,
        'view only'
    ),
    (
        'Allows HR Processor to view and modify request information.',
        TRUE,
        TRUE,
        FALSE,
        'modification'
    ),
    (
        'Allows the Manager to review and approve requests.',
        TRUE,
        FALSE,
        TRUE,
        'approval'
    ),
    (
        'Provides full access to request information and actions.',
        TRUE,
        TRUE,
        TRUE,
        'full access'
    ),

    -- ADDED ROWS
    (
        'Allows an HR Processor to view and modify requests specifically assigned to them.',
        TRUE,
        TRUE,
        FALSE,
        'modification'
    ),
    (
        'Allows a department manager to view, update, and approve requests within their department.',
        TRUE,
        TRUE,
        TRUE,
        'full access'
    );



-- ============================================================
-- DEPARTMENT
-- ============================================================

INSERT INTO department (
    manager_id,
    dept_name
)
VALUES
    (NULL, 'Human Resources'),
    (NULL, 'Information Technology'),
    (NULL, 'Finance'),
    (NULL, 'Operations');


-- ============================================================
-- EMPLOYEE
-- ============================================================

INSERT INTO employee (
    manager_id,
    department_id,
    first_name,
    last_name,
    title,
    start_date,
    email_address
)
VALUES
    (
        NULL,
        1,
        'Morgan',
        'Taylor',
        'HR Manager',
        '2022-01-10 08:00:00',
        'morgan.taylor@example.com'
    ),
    (
        1,
        1,
        'Alex',
        'Johnson',
        'HR Specialist',
        '2023-05-15 08:00:00',
        'alex.johnson@example.com'
    ),
    (
        1,
        1,
        'Serena',
        'Bossier',
        'HR Specialist',
        '2017-03-05 08:00:00',
        'serena.bossier@example.com'
    ),
    (
        1,
        1,
        'Ethan',
        'Brooks',
        'HR Specialist',
        '2017-03-05 08:00:00',
        'ethan.brooks@example.com'
    ),
    (
        NULL,
        2,
        'Jordan',
        'Smith',
        'IT Manager',
        '2021-08-02 08:00:00',
        'jordan.smith@example.com'
    ),
    (
        5,
        2,
        'Casey',
        'Williams',
        'Systems Analyst',
        '2024-02-12 08:00:00',
        'casey.williams@example.com'
    ),
    (
        NULL,
        3,
        'Riley',
        'Davis',
        'Finance Manager',
        '2020-06-15 08:00:00',
        'riley.davis@example.com'
    ),
    (
        NULL,
        4,
        'Cameron',
        'Brown',
        'Operations Manager',
        '2021-03-22 08:00:00',
        'cameron.brown@example.com'
    ),
    (
        NULL,
        4,
        'Olivia',
        'Ramirez',
        'Operations Administrator',
        '2023-06-22 08:00:00',
        'olivia.ramirez@example.com'
    ),
    (
        NULL,
        4,
        'Ava',
        'Patel',
        'Operations Administrator',
        '2012-02-12 08:00:00',
        'ava.patel@example.com'
    );


-- ============================================================
-- ASSIGN DEPARTMENT MANAGERS
-- ============================================================

UPDATE department
SET manager_id = 1
WHERE department_id = 1;

UPDATE department
SET manager_id = 3
WHERE department_id = 2;

UPDATE department
SET manager_id = 5
WHERE department_id = 3;

UPDATE department
SET manager_id = 6
WHERE department_id = 4;


-- ============================================================
-- WORKFLOW STEP
-- ============================================================

INSERT INTO workflow_step (
    request_type_id,
    step_name,
    step_num,
    is_active,
    step_code
)
VALUES
    (
        1,
        'HR Processing',
        1,
        TRUE,
        'hr_process'
    ),
    (
        1,
        'Quality Control',
        2,
        TRUE,
        'qc'
    ),
    (
        1,
        'Complete',
        3,
        TRUE,
        'complete'
    ),
    (
        2,
        'HR Processing',
        1,
        TRUE,
        'hr_process'
    ),
    (
        2,
        'Manager Approval',
        2,
        TRUE,
        'approval'
    ),
    (
        2,
        'Complete',
        3,
        TRUE,
        'complete'
    );


-- ============================================================
-- REQUEST TYPE FIELD
-- ============================================================

INSERT INTO request_type_field (
    request_type_id,
    field_name,
    field_label,
    field_type,
    is_required,
    display_order
)
VALUES
    (
        1,
        'information_to_change',
        'Information to Change',
        'text',
        TRUE,
        1
    ),
    (
        1,
        'new_information',
        'New Information',
        'text',
        TRUE,
        2
    ),
    (
        2,
        'leave_start_date',
        'Leave Start Date',
        'date',
        TRUE,
        1
    ),
    (
        2,
        'leave_end_date',
        'Leave End Date',
        'date',
        TRUE,
        2
    ),
    (
        2,
        'leave_reason',
        'Reason for Leave',
        'text',
        TRUE,
        3
    ),

    -- 3 - Benefits Inquiry
    (
        3,
        'benefit_type',
        'Benefit Type',
        'text',
        TRUE,
        1
    ),
    (
        3,
        'benefit_question',
        'Benefits Question',
        'text',
        TRUE,
        2
    ),
    (
        3,
        'coverage_date',
        'Requested Coverage Date',
        'date',
        FALSE,
        3
    ),

    -- 4 - Payroll Correction
    (
        4,
        'pay_period',
        'Pay Period',
        'text',
        TRUE,
        1
    ),
    (
        4,
        'payroll_issue',
        'Payroll Issue',
        'text',
        TRUE,
        2
    ),
    (
        4,
        'expected_amount',
        'Expected Amount',
        'text',
        FALSE,
        3
    ),
    (
        4,
        'actual_amount',
        'Actual Amount',
        'text',
        FALSE,
        4
    ),

    -- 5 - Employment Verification
    (
        5,
        'verification_purpose',
        'Purpose of Verification',
        'text',
        TRUE,
        1
    ),
    (
        5,
        'recipient_name',
        'Recipient Name',
        'text',
        TRUE,
        2
    ),
    (
        5,
        'information_requested',
        'Information to Verify',
        'text',
        TRUE,
        3
    ),
    (
        5,
        'needed_by_date',
        'Needed By Date',
        'date',
        FALSE,
        4
    ),

    -- 6 - Workplace Accommodation
    (
        6,
        'accommodation_requested',
        'Accommodation Requested',
        'text',
        TRUE,
        1
    ),
    (
        6,
        'accommodation_reason',
        'Reason for Accommodation',
        'text',
        TRUE,
        2
    ),
    (
        6,
        'requested_start_date',
        'Requested Start Date',
        'date',
        TRUE,
        3
    ),
    (
        6,
        'requested_end_date',
        'Requested End Date',
        'date',
        FALSE,
        4
    );


-- ============================================================
-- REQUEST
-- ============================================================

INSERT INTO request (
    request_type_id,
    employee_id,
    assigned_emp_id,
    current_step_id,
    priority_level,
    expected_completion,
    brief_summary,
    confidentiality_level,
    intake_source
)
VALUES
    -- Assigned requests
    (
        1,
        5,
        2,
        1,
        'medium',
        '2026-10-02',
        'Request to update the employee job title in the HR system.',
        'Nonconfidential',
        'self_service'
    ),
    (
        2,
        6,
        1,
        5,
        'high',
        '2026-10-05',
        'Employee submitted a leave request requiring manager approval.',
        'Confidential',
        'email_service'
    ),
    (
        1,
        7,
        1,
        1,
        'low',
        '2026-10-12',
        'Employee requested an update to their preferred name.',
        'Nonconfidential',
        'self_service'
    ),
    (
        2,
        8,
        2,
        5,
        'medium',
        '2026-10-14',
        'Employee submitted a request for scheduled medical leave.',
        'Confidential',
        'self_service'
    ),
    (
        1,
        9,
        1,
        1,
        'high',
        '2026-10-11',
        'Employee reported an incorrect department assignment in the HR system.',
        'Nonconfidential',
        'email_service'
    ),
    (
        2,
        10,
        2,
        5,
        'medium',
        '2026-10-18',
        'Employee requested review of available family leave options.',
        'Confidential',
        'email_service'
    ),
    (
        1,
        5,
        1,
        1,
        'low',
        '2026-10-20',
        'Employee requested an update to their office location.',
        'Nonconfidential',
        'self_service'
    ),

    -- Unassigned requests
    (
        2,
        6,
        NULL,
        1,
        'high',
        '2026-10-13',
        'Employee submitted an urgent leave request that requires HR review.',
        'Confidential',
        'email_service'
    ),
    (
        1,
        7,
        NULL,
        1,
        'medium',
        '2026-10-16',
        'Employee requested a correction to their supervisor information.',
        'Nonconfidential',
        'self_service'
    ),
    (
        2,
        8,
        NULL,
        1,
        'low',
        '2026-10-22',
        'Employee requested information about available personal leave.',
        'Confidential',
        'self_service'
    ),
    (
        1,
        9,
        NULL,
        1,
        'medium',
        '2026-10-17',
        'Employee reported an incorrect work phone number in their profile.',
        'Nonconfidential',
        'email_service'
    ),
    (
        2,
        10,
        NULL,
        1,
        'high',
        '2026-10-15',
        'Employee submitted a time-sensitive leave request for HR processing.',
        'Confidential',
        'email_service'
    ),

    -- Additional request types
    (
        3,
        5,
        NULL,
        1,
        'low',
        '2026-10-24',
        'Employee requested information about available dental and vision benefits.',
        'Nonconfidential',
        'self_service'
    ),
    (
        4,
        6,
        2,
        1,
        'high',
        '2026-10-19',
        'Employee reported an incorrect overtime amount on their most recent paycheck.',
        'Confidential',
        'email_service'
    ),
    (
        5,
        9,
        NULL,
        1,
        'low',
        '2026-10-25',
        'Employee requested an employment verification letter for a housing application.',
        'Nonconfidential',
        'self_service'
    ),
    (
        6,
        10,
        1,
        1,
        'medium',
        '2026-10-23',
        'Employee requested an adjusted work schedule as a workplace accommodation.',
        'Confidential',
        'email_service'
    );


-- ============================================================
-- REQUEST FIELD VALUE
-- ============================================================

INSERT INTO request_field_value (
    field_id,
    request_id,
    field_val
)
VALUES
    (
        1,
        1,
        'Job title'
    ),
    (
        2,
        1,
        'Senior Systems Analyst'
    ),
    (
        3,
        2,
        '2026-10-15'
    ),
    (
        4,
        2,
        '2026-10-20'
    ),
    (
        5,
        2,
        'Personal leave'
    );


-- ============================================================
-- REQUEST NOTES
-- ============================================================

INSERT INTO request_notes (
    request_id,
    created_by_emp_id,
    note
)
VALUES
    (
        1,
        2,
        'Request received and employee information is being reviewed.'
    ),
    (
        2,
        1,
        'Leave request forwarded for manager approval.'
    );


-- ============================================================
-- APPROVAL
-- ============================================================

INSERT INTO approval (
    request_id,
    approving_emp_id,
    summary,
    decision_date,
    decision
)
VALUES
    (
        2,
        1,
        'Leave request reviewed and approved by the HR manager.',
        CURRENT_TIMESTAMP,
        'approved'
    );


-- ============================================================
-- EMPLOYEE HISTORY
-- ============================================================

INSERT INTO employee_history (
    employee_id,
    modified_by_employee_id,
    modified_field,
    previous_value,
    current_value,
    type
)
VALUES
    (
        4,
        3,
        'title',
        'Junior Systems Analyst',
        'Systems Analyst',
        'updated'
    ),
    (
        2,
        1,
        'title',
        'HR Assistant',
        'HR Specialist',
        'updated'
    );

-- ============================================================
-- AUTHORIZATION
-- ============================================================

INSERT INTO authorization (
    auth_type_id,
    employee_id,
    authorized_by_id,
    auth_reason
)
VALUES
    -- ========================================================
    -- ORIGINAL ROWS - DO NOT REMOVE OR ALTER
    -- ========================================================
    (
        4,
        1,
        1,
        'HR manager requires approval authorization for employee requests.'
    ),
    (
        3,
        2,
        1,
        'HR specialist requires modification access to process requests.'
    ),
    (
        1,
        4,
        3,
        'Systems analyst requires view access to assigned request information.'
    ),

    -- ========================================================
    -- ADDITIONAL HR AUTHORIZATIONS
    -- ========================================================
    (
        5,
        1,
        1,
        'HR Manager requires full access to HR requests and request actions.'
    ),
    (
        6,
        3,
        1,
        'HR Specialist requires access to requests assigned for processing.'
    ),
    (
        6,
        4,
        1,
        'HR Specialist requires access to requests assigned for processing.'
    ),

    -- ========================================================
    -- EMPLOYEE SELF-SERVICE AUTHORIZATIONS
    -- ========================================================
    (
        1,
        5,
        1,
        'Employee requires access to view their own submitted requests.'
    ),
    (
        1,
        6,
        1,
        'Employee requires access to view their own submitted requests.'
    ),
    (
        1,
        7,
        1,
        'Employee requires access to view their own submitted requests.'
    ),
    (
        1,
        8,
        1,
        'Employee requires access to view their own submitted requests.'
    ),
    (
        1,
        9,
        1,
        'Employee requires access to view their own submitted requests.'
    ),
    (
        1,
        10,
        1,
        'Employee requires access to view their own submitted requests.'
    ),

    -- ========================================================
    -- DEPARTMENT MANAGER AUTHORIZATIONS
    -- ========================================================
    (
        2,
        5,
        1,
        'IT Manager requires view access to requests submitted by employees in the IT department.'
    ),
    (
        2,
        7,
        1,
        'Finance Manager requires view access to requests submitted by employees in the Finance department.'
    ),
    (
        2,
        8,
        1,
        'Operations Manager requires view access to requests submitted by employees in the Operations department.'
    );

-- ============================================================
-- REQUEST AUTH
-- ============================================================

INSERT INTO request_auth (
    request_id,
    employee_id,
    auth_id,
    expiration_date
)
VALUES
    -- ========================================================
    -- ORIGINAL ROWS - DO NOT REMOVE OR ALTER
    -- ========================================================
    (
        2,
        1,
        1,
        NULL
    ),
    (
        1,
        2,
        2,
        NULL
    ),

    -- ========================================================
    -- EMPLOYEE SELF-VIEW AUTHORIZATION
    -- ========================================================

    -- Jordan Smith
    (
        1,
        5,
        7,
        NULL
    ),
    (
        7,
        5,
        7,
        NULL
    ),
    (
        13,
        5,
        7,
        NULL
    ),

    -- Casey Williams
    (
        2,
        6,
        8,
        NULL
    ),
    (
        8,
        6,
        8,
        NULL
    ),
    (
        14,
        6,
        8,
        NULL
    ),

    -- Riley Davis
    (
        3,
        7,
        9,
        NULL
    ),
    (
        9,
        7,
        9,
        NULL
    ),

    -- Cameron Brown
    (
        4,
        8,
        10,
        NULL
    ),
    (
        10,
        8,
        10,
        NULL
    ),

    -- Olivia Ramirez
    (
        5,
        9,
        11,
        NULL
    ),
    (
        11,
        9,
        11,
        NULL
    ),
    (
        15,
        9,
        11,
        NULL
    ),

    -- Ava Patel
    (
        6,
        10,
        12,
        NULL
    ),
    (
        12,
        10,
        12,
        NULL
    ),
    (
        16,
        10,
        12,
        NULL
    ),

    -- ========================================================
    -- ASSIGNED HR PROCESSOR AUTHORIZATION
    -- ========================================================

    -- Morgan Taylor
    (
        2,
        1,
        4,
        NULL
    ),
    (
        3,
        1,
        4,
        NULL
    ),
    (
        5,
        1,
        4,
        NULL
    ),
    (
        7,
        1,
        4,
        NULL
    ),
    (
        16,
        1,
        4,
        NULL
    ),

    -- Alex Johnson
    -- Request 1 already exists above as an ORIGINAL row
    (
        4,
        2,
        2,
        NULL
    ),
    (
        6,
        2,
        2,
        NULL
    ),
    (
        14,
        2,
        2,
        NULL
    ),

    -- ========================================================
    -- DEPARTMENT MANAGER VIEW AUTHORIZATION
    -- ========================================================

    -- Jordan Smith - IT Manager
    -- Casey Williams submissions
    (
        2,
        5,
        13,
        NULL
    ),
    (
        8,
        5,
        13,
        NULL
    ),
    (
        14,
        5,
        13,
        NULL
    ),

    -- Cameron Brown - Operations Manager
    -- Olivia Ramirez and Ava Patel submissions
    (
        5,
        8,
        15,
        NULL
    ),
    (
        6,
        8,
        15,
        NULL
    ),
    (
        11,
        8,
        15,
        NULL
    ),
    (
        12,
        8,
        15,
        NULL
    ),
    (
        15,
        8,
        15,
        NULL
    ),
    (
        16,
        8,
        15,
        NULL
    );


-- ============================================================
-- REQUEST TYPE AUTH
-- ============================================================

INSERT INTO request_type_auth (
    request_type_id,
    auth_type_id,
    expiration_date
)
VALUES
    (
        1,
        3,
        '2027-09-30 23:59:59'
    ),
    (
        2,
        4,
        '2027-09-30 23:59:59'
    );