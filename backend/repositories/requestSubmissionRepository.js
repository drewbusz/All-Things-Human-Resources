
const { pool } = require("../config/database");

function repositoryError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

// Get request types that are currently active
async function getActiveRequestTypes() {
    const [rows] = await pool.execute(`
        SELECT
            request_type_id,
            name,
            description,
            approval_required
        FROM request_type
        WHERE is_active = TRUE
        ORDER BY name ASC
    `);

    return rows;
}

// Save a new request and record its creation
async function createRequest({
    employeeId,
    requestTypeId,
    briefSummary,
    confidentialityLevel,
    intakeSource
}) {
    const connection = await pool.getConnection();
    let transactionStarted = false;

    try {
        await connection.beginTransaction();
        transactionStarted = true;

        // Check that the employee exists and is active
        const [employees] = await connection.execute(`
            SELECT employee_id
            FROM employee
            WHERE employee_id = ?
              AND status = 'active'
            LIMIT 1
        `, [employeeId]);

        if (employees.length === 0) {
            throw repositoryError(
                "The submitting employee is not available or active.",
                "ACTING_EMPLOYEE_NOT_AVAILABLE"
            );
        }

        // Make sure the selected request type is available
        const [types] = await connection.execute(`
            SELECT request_type_id
            FROM request_type
            WHERE request_type_id = ?
              AND is_active = TRUE
            LIMIT 1
        `, [requestTypeId]);

        if (types.length === 0) {
            throw repositoryError(
                "The selected request type is not available.",
                "REQUEST_TYPE_NOT_AVAILABLE"
            );
        }

        // Start the request at its first active workflow step
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
                "This request type has no active workflow step.",
                "NO_INITIAL_WORKFLOW"
            );
        }

        const workflowStepId = Number(steps[0].workflow_step_id);

        // Create the request without assigning it to HR yet
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
                ?,
                ?
            )
        `, [
            requestTypeId,
            employeeId,
            workflowStepId,
            briefSummary,
            confidentialityLevel,
            intakeSource
        ]);

        const requestId = Number(insertResult.insertId);

        if (!Number.isSafeInteger(requestId) || requestId <= 0) {
            throw new Error(
                "The database did not return a valid request ID."
            );
        }

        // Add a history record for the new request
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
            employeeId,
            String(requestId)
        ]);

        // Only save once everything succeeds
        await connection.commit();
        transactionStarted = false;

        return {
            request_id: requestId,
            request_type_id: requestTypeId,
            employee_id: employeeId,
            current_step_id: workflowStepId,
            brief_summary: briefSummary,
            confidentiality_level: confidentialityLevel,
            intake_source: intakeSource
        };

    } catch (error) {

        // Undo the changes if anything fails
        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Request creation rollback failed:",
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
    getActiveRequestTypes,
    createRequest
};
