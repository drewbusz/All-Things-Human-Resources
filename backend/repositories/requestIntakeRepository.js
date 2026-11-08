
const { pool } = require("../config/database");

function repositoryError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function historyValue(value) {
    return String(value ?? "").slice(0, 255);
}

// Get requests that still need intake review
async function getPendingRequests(source = "all") {
    const [rows] = await pool.execute(`
        SELECT rv.*
        FROM request_view rv
        WHERE rv.assigned_emp_id IS NULL
          AND rv.confidentiality_level IN (
              'Nonconfidential',
              'Confidential'
          )
          AND (? = 'all' OR rv.intake_source = ?)
          AND NOT EXISTS (
              SELECT 1
              FROM request_history rh
              WHERE rh.request_id = rv.request_id
                AND rh.modified_field = 'intake_verification'
                AND rh.current_value = 'verified'
          )
        ORDER BY
            rv.submission_date DESC,
            rv.request_id DESC
    `, [source, source]);

    return rows;
}

// Get a request and its intake review status
async function getIntakeRequest(requestId) {
    const [rows] = await pool.execute(`
        SELECT
            rv.*,
            EXISTS (
                SELECT 1
                FROM request_history rh
                WHERE rh.request_id = rv.request_id
                  AND rh.modified_field = 'intake_verification'
                  AND rh.current_value = 'verified'
            ) AS reviewed
        FROM request_view rv
        WHERE rv.request_id = ?
          AND rv.confidentiality_level IN (
              'Nonconfidential',
              'Confidential'
          )
        LIMIT 1
    `, [requestId]);

    if (rows.length === 0) {
        return null;
    }

    return {
        ...rows[0],
        reviewed: Boolean(rows[0].reviewed)
    };
}

// Save classification changes and mark intake as reviewed
async function reviewRequest(
    requestId,
    actingEmployeeId,
    {
        requestTypeId,
        confidentialityLevel
    }
) {
    const connection = await pool.getConnection();
    let transactionStarted = false;

    try {
        await connection.beginTransaction();
        transactionStarted = true;

        const [requests] = await connection.execute(`
            SELECT
                request_id,
                request_type_id,
                assigned_emp_id,
                current_step_id,
                confidentiality_level
            FROM request
            WHERE request_id = ?
            FOR UPDATE
        `, [requestId]);

        if (requests.length === 0) {
            throw repositoryError(
                "The request was not found.",
                "REQUEST_NOT_FOUND"
            );
        }

        const current = requests[0];

        if (current.assigned_emp_id !== null) {
            throw repositoryError(
                "This request has already been assigned.",
                "REQUEST_ALREADY_ASSIGNED"
            );
        }

        if (current.confidentiality_level === "Highly Confidential") {
            throw repositoryError(
                "Highly Confidential requests require separate authorization.",
                "REQUEST_ACCESS_DENIED"
            );
        }

        const [existingReviews] = await connection.execute(`
            SELECT request_history_id
            FROM request_history
            WHERE request_id = ?
              AND modified_field = 'intake_verification'
              AND current_value = 'verified'
            LIMIT 1
        `, [requestId]);

        if (existingReviews.length > 0) {
            throw repositoryError(
                "This request has already completed intake review.",
                "REQUEST_ALREADY_REVIEWED"
            );
        }

        const nextTypeId =
            requestTypeId ?? Number(current.request_type_id);

        const nextConfidentiality =
            confidentialityLevel ?? current.confidentiality_level;

        const [types] = await connection.execute(`
            SELECT request_type_id
            FROM request_type
            WHERE request_type_id = ?
              AND is_active = TRUE
            LIMIT 1
        `, [nextTypeId]);

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
        `, [nextTypeId]);

        if (steps.length === 0) {
            throw repositoryError(
                "The selected request type has no active workflow.",
                "NO_INITIAL_WORKFLOW"
            );
        }

        const typeChanged =
            nextTypeId !== Number(current.request_type_id);

        if (typeChanged) {
            const [fields] = await connection.execute(`
                SELECT COUNT(*) AS field_count
                FROM request_field_value
                WHERE request_id = ?
            `, [requestId]);

            if (Number(fields[0].field_count) > 0) {
                throw repositoryError(
                    "This request has saved form fields that must be reviewed before changing its type.",
                    "REQUEST_FIELDS_CONFLICT"
                );
            }
        }

        const nextStepId =
            typeChanged || current.current_step_id === null
                ? Number(steps[0].workflow_step_id)
                : Number(current.current_step_id);

        const changes = [];

        if (typeChanged) {
            changes.push({
                field: "request_type_id",
                oldValue: current.request_type_id,
                newValue: nextTypeId
            });
        }

        if (
            Number(current.current_step_id) !== nextStepId
        ) {
            changes.push({
                field: "current_step_id",
                oldValue: current.current_step_id,
                newValue: nextStepId
            });
        }

        if (
            current.confidentiality_level !== nextConfidentiality
        ) {
            changes.push({
                field: "confidentiality_level",
                oldValue: current.confidentiality_level,
                newValue: nextConfidentiality
            });
        }

        await connection.execute(`
            UPDATE request
            SET
                request_type_id = ?,
                current_step_id = ?,
                confidentiality_level = ?
            WHERE request_id = ?
        `, [
            nextTypeId,
            nextStepId,
            nextConfidentiality,
            requestId
        ]);

        // Record any changes made during review
        for (const change of changes) {
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
                actingEmployeeId,
                change.field,
                historyValue(change.oldValue),
                historyValue(change.newValue)
            ]);
        }

        // This marks the request as reviewed
        await connection.execute(`
            INSERT INTO request_history (
                request_id,
                created_by_emp_id,
                modified_field,
                previous_value,
                current_value,
                type
            )
            VALUES (
                ?,
                ?,
                'intake_verification',
                'pending',
                'verified',
                'updated'
            )
        `, [
            requestId,
            actingEmployeeId
        ]);

        await connection.commit();
        transactionStarted = false;

        return getIntakeRequest(requestId);

    } catch (error) {
        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Intake review rollback failed:",
                    rollbackError
                );
            }
        }

        throw error;

    } finally {
        connection.release();
    }
}

// Create a request from structured email information
async function createEmailRequest({
    actingEmployeeId,
    employeeEmail,
    requestTypeId,
    briefSummary
}) {
    const connection = await pool.getConnection();
    let transactionStarted = false;

    try {
        await connection.beginTransaction();
        transactionStarted = true;

        const [employees] = await connection.execute(`
            SELECT employee_id
            FROM employee
            WHERE email_address = ?
              AND status = 'active'
            LIMIT 1
        `, [employeeEmail]);

        if (employees.length === 0) {
            throw repositoryError(
                "No active employee matches the submitted email address.",
                "EMPLOYEE_NOT_FOUND"
            );
        }

        const employeeId = Number(employees[0].employee_id);

        const [types] = await connection.execute(`
            SELECT request_type_id
            FROM request_type
            WHERE request_type_id = ?
              AND is_active = TRUE
            LIMIT 1
        `, [requestTypeId]);

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
        `, [requestTypeId]);

        if (steps.length === 0) {
            throw repositoryError(
                "The selected request type has no active workflow.",
                "NO_INITIAL_WORKFLOW"
            );
        }

        const workflowStepId = Number(
            steps[0].workflow_step_id
        );

        const [insertResult] = await connection.execute(`
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
            VALUES (
                ?,
                ?,
                NULL,
                ?,
                NULL,
                NULL,
                ?,
                'Confidential',
                'email_service'
            )
        `, [
            requestTypeId,
            employeeId,
            workflowStepId,
            briefSummary
        ]);

        const requestId = Number(insertResult.insertId);

        await connection.execute(`
            INSERT INTO request_history (
                request_id,
                created_by_emp_id,
                modified_field,
                previous_value,
                current_value,
                type
            )
            VALUES (
                ?,
                ?,
                'request_created',
                '',
                ?,
                'created'
            )
        `, [
            requestId,
            actingEmployeeId,
            String(requestId)
        ]);

        await connection.commit();
        transactionStarted = false;

        return {
            request_id: requestId,
            request_type_id: requestTypeId,
            employee_id: employeeId,
            current_step_id: workflowStepId,
            brief_summary: briefSummary,
            confidentiality_level: "Confidential",
            intake_source: "email_service",
            reviewed: false
        };

    } catch (error) {
        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Email intake rollback failed:",
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
    getPendingRequests,
    getIntakeRequest,
    reviewRequest,
    createEmailRequest
};
