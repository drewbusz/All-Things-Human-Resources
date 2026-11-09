
const { pool } = require("../config/database");
const employeeService = require("../services/employeeService");
const requestRepository = require("./requestRepository");

function repositoryError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function historyValue(value) {
    return String(value ?? "").slice(0, 255);
}

// Get requests that haven't been completed
async function getActiveRequests() {
    const [rows] = await pool.execute(`
        SELECT *
        FROM request_view
        WHERE status_code IS NULL OR status_code <> 'complete'
        ORDER BY submission_date DESC, request_id DESC
    `);

    return rows;
}

// Update assignment and classification in one transaction
async function manageRequest(requestId, actorId, changes) {
    const connection = await pool.getConnection();
    let transactionStarted = false;

    try {
        await connection.beginTransaction();
        transactionStarted = true;

        // Check the HR employee's permissions
        const [authorizations] = await connection.execute(`
            SELECT a.auth_type_id
            FROM authorization a
            JOIN authorization_type at
                ON at.auth_type_id = a.auth_type_id
            JOIN employee e
                ON e.employee_id = a.employee_id
            WHERE a.employee_id = ?
              AND e.status = 'active'
              AND a.auth_type_id IN (3, 5)
              AND a.is_active = TRUE
              AND at.is_active = TRUE
              AND at.can_update = TRUE
              AND a.effective_date <= CURRENT_TIMESTAMP
              AND (
                  a.expiration_date IS NULL
                  OR a.expiration_date >= CURRENT_TIMESTAMP
              )
            LIMIT 1
        `, [actorId]);

        if (authorizations.length === 0) {
            throw repositoryError(
                "You are not authorized to manage HR requests.",
                "REQUEST_ACCESS_DENIED"
            );
        }

        // Lock the request while making changes
        const [rows] = await connection.execute(`
            SELECT
                r.request_id,
                r.request_type_id,
                r.assigned_emp_id,
                r.current_step_id,
                r.priority_level,
                DATE_FORMAT(
                    r.expected_completion,
                    '%Y-%m-%d'
                ) AS expected_completion,
                r.confidentiality_level,
                ws.step_code
            FROM request r
            LEFT JOIN workflow_step ws
                ON ws.workflow_step_id = r.current_step_id
            WHERE r.request_id = ?
            FOR UPDATE
        `, [requestId]);

        if (rows.length === 0) {
            throw repositoryError(
                "The request was not found.",
                "REQUEST_NOT_FOUND"
            );
        }

        const current = rows[0];

        // Highly Confidential requests have separate rules
        if (
            current.confidentiality_level ===
            "Highly Confidential"
        ) {
            throw repositoryError(
                "Highly Confidential requests must be managed through their separate access workflow.",
                "REQUEST_ACCESS_DENIED"
            );
        }

        if (current.step_code === "complete") {
            throw repositoryError(
                "Completed requests cannot be reassigned or reclassified.",
                "REQUEST_COMPLETED"
            );
        }

        const next = {
            request_type_id:
                changes.request_type_id ??
                Number(current.request_type_id),

            assigned_emp_id:
                changes.assigned_emp_id ??
                current.assigned_emp_id,

            current_step_id:
                current.current_step_id,

            priority_level:
                "priority_level" in changes
                    ? changes.priority_level
                    : current.priority_level,

            expected_completion:
                "expected_completion" in changes
                    ? changes.expected_completion
                    : current.expected_completion,

            confidentiality_level:
                changes.confidentiality_level ??
                current.confidentiality_level
        };

        const typeChanged =
            next.request_type_id !==
            Number(current.request_type_id);

        const assigneeChanged =
            String(next.assigned_emp_id ?? "") !==
            String(current.assigned_emp_id ?? "");

        // Reclassification resets the workflow to its first step
        if (typeChanged) {
            if (current.step_code !== "hr_process") {
                throw repositoryError(
                    "Reclassification is only available during HR Processing.",
                    "REQUEST_RECLASSIFICATION_BLOCKED"
                );
            }

            // Don't leave old request-type fields attached
            const [fieldRows] = await connection.execute(`
                SELECT field_id
                FROM request_field_value
                WHERE request_id = ?
                LIMIT 1
            `, [requestId]);

            if (fieldRows.length > 0) {
                throw repositoryError(
                    "The request has type-specific field values. Review those fields before reclassifying.",
                    "REQUEST_FIELDS_CONFLICT"
                );
            }

            const [types] = await connection.execute(`
                SELECT request_type_id
                FROM request_type
                WHERE request_type_id = ?
                  AND is_active = TRUE
                LIMIT 1
            `, [next.request_type_id]);

            if (types.length === 0) {
                throw repositoryError(
                    "The selected request type is not active.",
                    "INVALID_REQUEST_TYPE"
                );
            }

            const [steps] = await connection.execute(`
                SELECT workflow_step_id
                FROM workflow_step
                WHERE request_type_id = ?
                  AND is_active = TRUE
                ORDER BY
                    step_num ASC,
                    workflow_step_id ASC
                LIMIT 1
            `, [next.request_type_id]);

            if (steps.length === 0) {
                throw repositoryError(
                    "The selected request type has no active workflow.",
                    "NO_INITIAL_WORKFLOW"
                );
            }

            next.current_step_id =
                Number(steps[0].workflow_step_id);
        }

        // Make sure the new assignee can process HR requests
        if (assigneeChanged) {
            const eligible =
                await employeeService.isEligibleHRAssignee(
                    Number(next.assigned_emp_id),
                    connection
                );

            if (!eligible) {
                throw repositoryError(
                    "The selected HR employee is not eligible for assignment.",
                    "ASSIGNEE_NOT_ELIGIBLE"
                );
            }
        }

        const trackedFields = [
            "request_type_id",
            "assigned_emp_id",
            "current_step_id",
            "priority_level",
            "expected_completion",
            "confidentiality_level"
        ];

        const updates = trackedFields.filter(field =>
            String(current[field] ?? "") !==
            String(next[field] ?? "")
        );

        if (updates.length > 0) {
            await connection.execute(`
                UPDATE request
                SET
                    request_type_id = ?,
                    assigned_emp_id = ?,
                    current_step_id = ?,
                    priority_level = ?,
                    expected_completion = ?,
                    confidentiality_level = ?
                WHERE request_id = ?
            `, [
                next.request_type_id,
                next.assigned_emp_id,
                next.current_step_id,
                next.priority_level,
                next.expected_completion,
                next.confidentiality_level,
                requestId
            ]);

            // Record each changed field
            for (const field of updates) {
                await connection.execute(`
                    INSERT INTO request_history (
                        request_id,
                        created_by_emp_id,
                        modified_field,
                        previous_value,
                        current_value,
                        type
                    )
                    VALUES (?, ?, ?, ?, ?, 'updated')
                `, [
                    requestId,
                    actorId,
                    field,
                    historyValue(current[field]),
                    historyValue(next[field])
                ]);
            }
        }

        await connection.commit();
        transactionStarted = false;

        return requestRepository.getRequestById(requestId);

    } catch (error) {
        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Request management rollback failed:",
                    rollbackError
                );
            }
        }

        throw error;

    } finally {
        connection.release();
    }
}

module.exports = {
    getActiveRequests,
    manageRequest
};
