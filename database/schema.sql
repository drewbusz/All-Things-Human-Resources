

-- ============================================================
-- REQUEST TYPE
-- ============================================================

CREATE TABLE request_type (
    request_type_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(125) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    description LONGTEXT NOT NULL,
    approval_required BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (request_type_id)
);


-- ============================================================
-- AUTHORIZATION TYPE
-- ============================================================

CREATE TABLE authorization_type (
    auth_type_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    description VARCHAR(255) NOT NULL,
    can_view BOOLEAN NOT NULL,
    can_update BOOLEAN NOT NULL,
    can_approve BOOLEAN NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    auth_type_name ENUM(
        'view only',
        'modification',
        'approval',
        'full access'
    ) NOT NULL,

    PRIMARY KEY (auth_type_id)
);


-- ============================================================
-- DEPARTMENT
-- ============================================================

CREATE TABLE department (
    department_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    manager_id BIGINT UNSIGNED NULL,
    dept_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    PRIMARY KEY (department_id)
);


-- ============================================================
-- EMPLOYEE
-- ============================================================

CREATE TABLE employee (
    employee_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    manager_id BIGINT UNSIGNED  DEFAULT NULL,
    department_id BIGINT UNSIGNED NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_date TIMESTAMP NULL,
    email_address VARCHAR(254) NOT NULL UNIQUE,

    PRIMARY KEY (employee_id),

    CONSTRAINT fk_employee_to_department
        FOREIGN KEY (department_id)
        REFERENCES department(department_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);


-- ============================================================
-- WORKFLOW STEP
-- ============================================================

CREATE TABLE workflow_step (
    workflow_step_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    request_type_id BIGINT UNSIGNED NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    step_num INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,

    step_code ENUM(
        'hr_process',
        'approval',
        'qc',
        'complete'
    ) NOT NULL,

    PRIMARY KEY (workflow_step_id),

    CONSTRAINT fk_workflow_step_request_type
        FOREIGN KEY (request_type_id)
        REFERENCES request_type(request_type_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);


-- ============================================================
-- REQUEST
-- ============================================================

CREATE TABLE request (
    request_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    request_type_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    assigned_emp_id BIGINT UNSIGNED NULL,
    current_step_id BIGINT UNSIGNED NULL,
    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    priority_level ENUM('high', 'medium', 'low') NULL,
    expected_completion DATE NULL,
    brief_summary LONGTEXT NOT NULL,

    confidentiality_level ENUM(
        'Nonconfidential',
        'Confidential',
        'Highly Confidential'
    ) NOT NULL,

    intake_source ENUM(
        'self_service',
        'email_service'
    ) NOT NULL,

    PRIMARY KEY (request_id),

    CONSTRAINT fk_request_request_type
        FOREIGN KEY (request_type_id)
        REFERENCES request_type(request_type_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT fk_request_employee
        FOREIGN KEY (employee_id)
        REFERENCES employee(employee_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT fk_request_assigned_employee
        FOREIGN KEY (assigned_emp_id)
        REFERENCES employee(employee_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT fk_request_workflow_step
        FOREIGN KEY (current_step_id)
        REFERENCES workflow_step(workflow_step_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);


-- ============================================================
-- REQUEST TYPE FIELD
-- ============================================================

CREATE TABLE request_type_field (
    field_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    request_type_id BIGINT UNSIGNED NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    field_label VARCHAR(50) NOT NULL,
    field_type VARCHAR(255) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL,

    PRIMARY KEY (field_id),

    CONSTRAINT fk_request_type
        FOREIGN KEY (request_type_id)
        REFERENCES request_type(request_type_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT uq_workflow_step_display_order
        UNIQUE (request_type_id, display_order)
);


-- ============================================================
-- REQUEST FIELD VALUE
-- ============================================================

CREATE TABLE request_field_value (
    field_id BIGINT UNSIGNED NOT NULL,
    request_id BIGINT UNSIGNED NOT NULL,
    field_val VARCHAR(255),
    value_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (field_id, request_id),

    CONSTRAINT fk_field_val_field
        FOREIGN KEY (field_id)
        REFERENCES request_type_field(field_id),

    CONSTRAINT fk_field_val_request
        FOREIGN KEY (request_id)
        REFERENCES request(request_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);


-- ============================================================
-- REQUEST NOTES
-- ============================================================

CREATE TABLE request_notes (
    request_note_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    request_id BIGINT UNSIGNED NOT NULL,
    created_by_emp_id BIGINT UNSIGNED NOT NULL,
    note LONGTEXT NOT NULL,
    note_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (request_note_id),

    CONSTRAINT fk_request
        FOREIGN KEY (request_id)
        REFERENCES request(request_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT fk_request_notes_created_by
        FOREIGN KEY (created_by_emp_id)
        REFERENCES employee(employee_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);


-- ============================================================
-- REQUEST HISTORY
-- ============================================================

CREATE TABLE request_history (
    request_history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    request_id BIGINT UNSIGNED NOT NULL,
    created_by_emp_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (request_history_id),

    CONSTRAINT fk_request_to_history
        FOREIGN KEY (request_id)
        REFERENCES request(request_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT fk_request_history_created_by
        FOREIGN KEY (created_by_emp_id)
        REFERENCES employee(employee_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);


-- ============================================================
-- APPROVAL
-- ============================================================

CREATE TABLE approval (
    approval_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    request_id BIGINT UNSIGNED NOT NULL,
    approving_emp_id BIGINT UNSIGNED NOT NULL,
    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    summary LONGTEXT NOT NULL,
    decision_date TIMESTAMP NULL,

    decision ENUM(
        'approved',
        'denied',
        'deferred'
    ),

    PRIMARY KEY (approval_id),

    CONSTRAINT fk_approval_to_request
        FOREIGN KEY (request_id)
        REFERENCES request(request_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT fk_approving_emp
        FOREIGN KEY (approving_emp_id)
        REFERENCES employee(employee_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);


-- ============================================================
-- EMPLOYEE HISTORY
-- ============================================================

CREATE TABLE employee_history (
    employee_history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    employee_id BIGINT UNSIGNED NOT NULL,
    modified_by_employee_id BIGINT UNSIGNED NOT NULL,
    modified_field VARCHAR(255) NOT NULL,
    previous_value VARCHAR(255) NOT NULL,
    current_value VARCHAR(255) NOT NULL,
    date_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    type ENUM(
        'created',
        'updated',
        'deleted'
    ) NOT NULL,

    PRIMARY KEY (employee_history_id),

    CONSTRAINT fk_employee_to_history
        FOREIGN KEY (employee_id)
        REFERENCES employee(employee_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT fk_modifying_emp_to_history
        FOREIGN KEY (modified_by_employee_id)
        REFERENCES employee(employee_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);


-- ============================================================
-- AUTHORIZATION
-- ============================================================

CREATE TABLE authorization (
    auth_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    auth_type_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    authorized_by_id BIGINT UNSIGNED NOT NULL,
    auth_reason VARCHAR(255) NOT NULL,
    effective_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expiration_date DATE NULL, 

    PRIMARY KEY (auth_id),

    CONSTRAINT fk_auth_type_to_auth
        FOREIGN KEY (auth_type_id)
        REFERENCES authorization_type(auth_type_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT fk_authorization_to_employee
        FOREIGN KEY (employee_id)
        REFERENCES employee(employee_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT fk_authorization_authorized_by
        FOREIGN KEY (authorized_by_id)
        REFERENCES employee(employee_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);


-- ============================================================
-- REQUEST AUTH
-- ============================================================

CREATE TABLE request_auth (
    request_auth_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    request_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    auth_id BIGINT UNSIGNED NOT NULL,
    effective_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMP NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    PRIMARY KEY (request_auth_id),

    CONSTRAINT fk_request_auth_to_request
        FOREIGN KEY (request_id)
        REFERENCES request(request_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT fk_request_auth_to_employee
        FOREIGN KEY (employee_id)
        REFERENCES employee(employee_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT fk_request_auth_to_authorization
        FOREIGN KEY (auth_id)
        REFERENCES authorization(auth_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);


-- ============================================================
-- REQUEST TYPE AUTH
-- ============================================================

CREATE TABLE request_type_auth (
    request_type_auth_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    request_type_id BIGINT UNSIGNED NOT NULL,
    auth_type_id BIGINT UNSIGNED NOT NULL,
    effective_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    PRIMARY KEY (request_type_auth_id),

    CONSTRAINT fk_type_auth_to_type
        FOREIGN KEY (request_type_id)
        REFERENCES request_type(request_type_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

    CONSTRAINT fk_request_type_auth_to_auth_type
        FOREIGN KEY (auth_type_id)
        REFERENCES authorization_type(auth_type_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
);


-- ============================================================
-- DEFERRED FOREIGN KEY CONSTRAINTS
-- ============================================================

ALTER TABLE department
    ADD CONSTRAINT fk_department_manager
        FOREIGN KEY (manager_id)
        REFERENCES employee(employee_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT;

ALTER TABLE department 
    ADD CONSTRAINT fk_employee_to_manager
        FOREIGN KEY (manager_id)
        REFERENCES employee(employee_id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,

-- ============================================================
-- REQUEST VIEW FOR SIMPLIFIED BACKEND PROCESSING 
-- ============================================================
CREATE VIEW request_view AS
SELECT
    r.request_id,
    r.request_type_id,
    rt.name AS request_type,
    r.employee_id,
    CONCAT(e.first_name, ' ', e.last_name) AS submitted_by,
    r.assigned_emp_id,
    CONCAT(a.first_name, ' ', a.last_name) AS assigned_to,
    r.current_step_id,
    ws.step_name AS current_step,
    ws.step_code,
    r.submission_date,
    r.priority_level,
    r.expected_completion,
    r.brief_summary,
    r.confidentiality_level,
    r.intake_source
FROM request r

JOIN request_type rt
    ON r.request_type_id = rt.request_type_id

JOIN employee e
    ON r.employee_id = e.employee_id

LEFT JOIN employee a
    ON r.assigned_emp_id = a.employee_id

LEFT JOIN workflow_step ws
    ON r.current_step_id = ws.workflow_step_id;