const { pool } = require("../config/database");


function toHistoryValue(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value).slice(0, 255);
}


/*
 * Retrieve request details.
 *
 * Access checks are performed by the request service.
 * An optional connection allows this query to participate
 * in an existing database transaction.
 */
async function getRequestById(
    requestId,
    connection = pool
) {

    const sql = `
        SELECT *
        FROM request_view
        WHERE request_id = ?
        LIMIT 1
    `;

    const [rows] = await connection.execute(
        sql,
        [requestId]
    );

    return rows[0] || null;
}


/*
 * Retrieve active workflow steps for a request type.
 */
async function getWorkflowStepsByRequestType(
    requestTypeId,
    connection = pool
) {

    const sql = `
        SELECT
            workflow_step_id,
            request_type_id,
            step_name,
            step_num,
            step_code
        FROM workflow_step
        WHERE request_type_id = ?
          AND is_active = TRUE
        ORDER BY step_num ASC
    `;

    const [rows] = await connection.execute(
        sql,
        [requestTypeId]
    );

    return rows;
}


/*
 * Retrieve change history for a request.
 *
 * The request service must authorize the read before
 * returning these records.
 */
async function getRequestHistoryByRequestId(
    requestId
) {

    const sql = `
        SELECT
            rh.request_history_id,
            rh.request_id,
            rh.created_by_emp_id,
            CONCAT(
                e.first_name,
                ' ',
                e.last_name
            ) AS changed_by,
            rh.modified_field,
            rh.previous_value,
            rh.current_value,
            rh.date_modified,
            rh.type
        FROM request_history rh
        INNER JOIN employee e
            ON rh.created_by_emp_id = e.employee_id
        WHERE rh.request_id = ?
        ORDER BY
            rh.date_modified DESC,
            rh.request_history_id DESC
    `;

    const [rows] = await pool.execute(
        sql,
        [requestId]
    );

    return rows;
}


/*
 * Retrieve requests assigned to an employee.
 *
 * The request service is responsible for applying
 * additional confidentiality restrictions.
 */
async function getAssignedRequestsByEmpId(
    employeeId
) {

    const sql = `
        SELECT *
        FROM request_view
        WHERE assigned_emp_id = ?
        ORDER BY submission_date DESC
    `;

    const [rows] = await pool.execute(
        sql,
        [employeeId]
    );

    return rows;
}


/*
 * Retrieve currently unassigned requests.
 *
 * The request service must filter the results based
 * on the acting employee's permissions.
 */
async function getUnassignedRequests() {

    const sql = `
        SELECT *
        FROM request_view
        WHERE assigned_emp_id IS NULL
        ORDER BY submission_date DESC
    `;

    const [rows] = await pool.execute(sql);

    return rows;
}


/*
 * Retrieve active request-specific authorizations.
 *
 * request_auth links an employee's authorization
 * record to an individual request.
 *
 * This is especially important for Highly Confidential
 * requests, which require explicitly permitted access.
 */
async function getRequestAuthorizations(
    requestId,
    employeeId,
    connection = pool
) {

    const sql = `
        SELECT
            ra.request_auth_id,
            ra.request_id,
            ra.employee_id,
            ra.auth_id,
            a.auth_type_id,
            at.auth_type_name,
            at.can_view,
            at.can_update,
            at.can_approve
        FROM request_auth ra
        INNER JOIN authorization a
            ON ra.auth_id = a.auth_id
            AND ra.employee_id = a.employee_id
        INNER JOIN authorization_type at
            ON a.auth_type_id = at.auth_type_id
        INNER JOIN employee e
            ON ra.employee_id = e.employee_id
        WHERE ra.request_id = ?
          AND ra.employee_id = ?
          AND ra.is_active = TRUE
          AND ra.effective_date <= CURRENT_TIMESTAMP
          AND (
                ra.expiration_date IS NULL
                OR ra.expiration_date >= CURRENT_TIMESTAMP
              )
          AND a.is_active = TRUE
          AND a.effective_date <= CURRENT_TIMESTAMP
          AND (
                a.expiration_date IS NULL
                OR a.expiration_date >= CURRENT_DATE
              )
          AND at.is_active = TRUE
          AND e.status = 'active'
    `;

    const [rows] = await connection.execute(
        sql,
        [requestId, employeeId]
    );

    return rows;
}


/*
 * Update a request and record each changed field.
 *
 * The optional validateLockedRequest function is
 * executed after the current request row is locked.
 *
 * Signature:
 *
 * validateLockedRequest(
 *     currentRequest,
 *     requestData,
 *     connection
 * )
 *
 * The callback may throw an error to reject the update.
 * A rejected update is rolled back.
 *
 * Validation can also return normalized update data.
 *
 * IMPORTANT:
 * State-dependent validation belongs in this callback.
 * It must not rely on a previously retrieved request.
 */
async function updateRequest(
    requestId,
    actingEmployeeId,
    requestData,
    validateLockedRequest = null
) {

    const connection =
        await pool.getConnection();

    let transactionStarted = false;

    try {

        await connection.beginTransaction();

        transactionStarted = true;


        /*
         * Lock the current request before evaluating
         * its assignment, type, confidentiality, or
         * workflow position.
         */
        const [rows] =
            await connection.execute(
                `
                SELECT
                    r.request_id,
                    r.request_type_id,
                    r.employee_id,
                    r.assigned_emp_id,
                    r.current_step_id,
                    ws.step_num AS current_step_num,
                    ws.request_type_id AS
                        current_step_request_type_id,
                    r.priority_level,
                    DATE_FORMAT(
                        r.expected_completion,
                        '%Y-%m-%d'
                    ) AS expected_completion,
                    r.brief_summary,
                    r.confidentiality_level
                FROM request r
                LEFT JOIN workflow_step ws
                    ON r.current_step_id =
                        ws.workflow_step_id
                WHERE r.request_id = ?
                FOR UPDATE
                `,
                [requestId]
            );


        if (rows.length === 0) {

            await connection.rollback();

            transactionStarted = false;

            return false;
        }


        const currentRequest = rows[0];


        /*
         * Validate the locked state.
         *
         * This is where the request service must check:
         *
         * - Acting employee authorization
         * - Request assignment
         * - Confidentiality restrictions
         * - Request type
         * - Workflow step membership
         * - Forward-only workflow progression
         *
         * Running validation inside the transaction
         * prevents a stale read from authorizing an
         * update against a newer workflow state.
         */
        let validatedData = { ...requestData };

        if (validateLockedRequest !== null) {

            if (
                typeof validateLockedRequest !== "function"
            ) {

                throw new TypeError(
                    "The request validation callback must be a function."
                );
            }


            const validationResult =
                await validateLockedRequest(
                    currentRequest,
                    { ...validatedData },
                    connection
                );


            if (validationResult !== undefined) {

                if (
                    validationResult === null ||
                    typeof validationResult !== "object" ||
                    Array.isArray(validationResult)
                ) {

                    throw new TypeError(
                        "Request validation must return an object or undefined."
                    );
                }

                validatedData = validationResult;
            }
        }


        /*
         * Only recognized database fields may be updated.
         *
         * Other submitted values cannot be spread into
         * the database update operation.
         */
        const trackedFields = [
            "assigned_emp_id",
            "current_step_id",
            "priority_level",
            "expected_completion",
            "brief_summary",
            "confidentiality_level"
        ];


        const updatedRequest = {
            ...currentRequest
        };


        for (const field of trackedFields) {

            if (
                Object.prototype.hasOwnProperty.call(
                    validatedData,
                    field
                )
            ) {

                updatedRequest[field] =
                    validatedData[field];
            }
        }


        const changes = [];


        for (const field of trackedFields) {

            const oldValue =
                currentRequest[field];

            const newValue =
                updatedRequest[field];


            if (
                String(oldValue ?? "") !==
                String(newValue ?? "")
            ) {

                changes.push({
                    field,
                    oldValue,
                    newValue
                });
            }
        }


        /*
         * Nothing changed.
         *
         * Validation has still been performed against
         * the locked request before returning success.
         */
        if (changes.length === 0) {

            await connection.commit();

            transactionStarted = false;

            return true;
        }


        /*
         * Persist the updated request.
         */
        await connection.execute(
            `
            UPDATE request
            SET
                assigned_emp_id = ?,
                current_step_id = ?,
                priority_level = ?,
                expected_completion = ?,
                brief_summary = ?,
                confidentiality_level = ?
            WHERE request_id = ?
            `,
            [
                updatedRequest.assigned_emp_id,
                updatedRequest.current_step_id,
                updatedRequest.priority_level,
                updatedRequest.expected_completion,
                updatedRequest.brief_summary,
                updatedRequest.confidentiality_level,
                requestId
            ]
        );


        /*
         * Record each modified field in the same
         * transaction as the request update.
         *
         * A failed history insert causes the request
         * update to be rolled back as well.
         */
        const historySql = `
            INSERT INTO request_history (
                request_id,
                created_by_emp_id,
                modified_field,
                previous_value,
                current_value,
                type
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;


        for (const change of changes) {

            await connection.execute(
                historySql,
                [
                    requestId,
                    actingEmployeeId,
                    change.field,
                    toHistoryValue(
                        change.oldValue
                    ),
                    toHistoryValue(
                        change.newValue
                    ),
                    "updated"
                ]
            );
        }


        await connection.commit();

        transactionStarted = false;

        return true;

    } catch (error) {

        if (transactionStarted) {

            try {

                await connection.rollback();

            } catch (rollbackError) {

                console.error(
                    "Request transaction rollback failed:",
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
    getRequestById,
    getWorkflowStepsByRequestType,
    getRequestHistoryByRequestId,
    getAssignedRequestsByEmpId,
    getUnassignedRequests,
    getRequestAuthorizations,
    updateRequest
};
