-- ============================================================
-- REQUEST TYPE
-- ============================================================

INSERT INTO request_type (
    name,
    is_active,
    description,
    approval_request
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
        NULL,
        2,
        'Jordan',
        'Smith',
        'IT Manager',
        '2021-08-02 08:00:00',
        'jordan.smith@example.com'
    ),
    (
        3,
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
    instake_source
)
VALUES
    (
        1,
        4,
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
        2,
        1,
        5,
        'high',
        '2026-10-05',
        'Employee submitted a leave request requiring manager approval.',
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
-- REQUEST HISTORY
-- ============================================================

INSERT INTO request_history (
    request_id,
    created_by_emp_id
)
VALUES
    (
        1,
        2
    ),
    (
        2,
        1
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