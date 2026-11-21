-- UC-5 setup for the existing seeded class database.
-- Run once after schema.sql and seed.sql. Do not reset the database.
USE all_things_hr;

-- Keep existing step codes and add a distinct HR approval review status.
ALTER TABLE workflow_step MODIFY COLUMN step_code ENUM(
    'hr_process', 'approval', 'review_approval', 'qc', 'complete'
) NOT NULL;

-- Leave Request and Payroll Correction already have Manager Approval.
-- Move later steps forward to make room for Review Approval.
UPDATE workflow_step AS step
LEFT JOIN workflow_step AS review_step
    ON review_step.request_type_id = step.request_type_id
    AND review_step.step_code = 'review_approval'
SET step.step_num = step.step_num + 1
WHERE step.request_type_id IN (2, 4)
  AND step.step_num >= 3
  AND review_step.workflow_step_id IS NULL;

INSERT INTO workflow_step (request_type_id, step_name, step_num, is_active, step_code)
SELECT rt.request_type_id, 'Review Approval', 3, TRUE, 'review_approval'
FROM request_type AS rt
WHERE rt.request_type_id IN (2, 4)
  AND NOT EXISTS (
      SELECT 1 FROM workflow_step AS step
      WHERE step.request_type_id = rt.request_type_id
        AND step.step_code = 'review_approval'
  );

-- Workplace Accommodation is marked approval-required but was missing
-- the Manager Approval and Review Approval steps.
UPDATE workflow_step AS step
LEFT JOIN workflow_step AS approval_step
    ON approval_step.request_type_id = step.request_type_id
    AND approval_step.step_code = 'approval'
SET step.step_num = step.step_num + 2
WHERE step.request_type_id = 6
  AND step.step_num >= 2
  AND approval_step.workflow_step_id IS NULL;

INSERT INTO workflow_step (request_type_id, step_name, step_num, is_active, step_code)
SELECT 6, 'Manager Approval', 2, TRUE, 'approval'
WHERE NOT EXISTS (
    SELECT 1 FROM workflow_step
    WHERE request_type_id = 6 AND step_code = 'approval'
);

INSERT INTO workflow_step (request_type_id, step_name, step_num, is_active, step_code)
SELECT 6, 'Review Approval', 3, TRUE, 'review_approval'
WHERE NOT EXISTS (
    SELECT 1 FROM workflow_step
    WHERE request_type_id = 6 AND step_code = 'review_approval'
);

-- Existing managers have view-only type 2. Give them approval type 4
-- without changing what type 2 itself permits.
INSERT INTO authorization (
    auth_type_id, employee_id, authorized_by_id, auth_reason
)
SELECT 4, manager.employee_id, 1,
       'Department manager approval access for the class demonstration.'
FROM employee AS manager
WHERE manager.employee_id IN (5, 7, 8)
  AND manager.status = 'active'
  AND NOT EXISTS (
      SELECT 1
      FROM authorization AS a
      JOIN authorization_type AS t ON t.auth_type_id = a.auth_type_id
      WHERE a.employee_id = manager.employee_id
        AND a.is_active = TRUE
        AND t.is_active = TRUE
        AND t.can_approve = TRUE
        AND a.effective_date <= CURRENT_TIMESTAMP
        AND (a.expiration_date IS NULL OR a.expiration_date >= CURRENT_DATE)
  );

-- Check the new steps and the demo managers after setup.
SELECT request_type_id, step_name, step_num, step_code
FROM workflow_step
WHERE request_type_id IN (2, 4, 6) AND is_active = TRUE
ORDER BY request_type_id, step_num;