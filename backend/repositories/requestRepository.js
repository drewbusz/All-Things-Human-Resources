const { pool } = require("../config/database");


function toHistoryValue(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value).slice(0, 255);
}


async function getRequestById(requestId) {

    const sql = `
        SELECT *
        FROM request_view
        WHERE request_id = ?
        LIMIT 1
    `;

    const [rows] = await pool.execute(
        sql,
        [requestId]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
}


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


async function getRequestAuthorizations(
    requestId,
    employeeId,
    connection = pool
) {

    const sql = `
        SELECT
            ra.request_auth_id,
            a.auth_type_id,
            at.can_view,
            at.can_update,
            at.can_approve
        FROM request_auth ra
        INNER JOIN authorization a
            ON ra.auth_id = a.auth_id
            AND ra.employee_id = a.employee_id
        INNER JOIN authorization_type at
            ON a.auth_type_id = at.auth_type_id
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
    `;

    const [rows] = await connection.execute(
        sql,
        [requestId, employeeId]
    );

    return rows;
}


async function updateRequest(
    requestId,
    actingEmployeeId,
    requestData,
    validateUpdate
) {

    if (typeof validateUpdate !== "function") {
        throw new Error(
            "Request update validation is required."
        );
    }

    const connection =
        await pool.getConnection();

    try {

        await connection.beginTransaction();

        const [rows] =
            await connection.execute(
                `
                SELECT
                    request_id,
                    request_type_id,
                    employee_id,
                    assigned_emp_id,
                    current_step_id,
                    priority_level,
                    DATE_FORMAT(
                        expected_completion,
                        '%Y-%m-%d'
                    ) AS expected_completion,
                    brief_summary,
                    confidentiality_level
                FROM request
                WHERE request_id = ?
                FOR UPDATE
                `,
                [requestId]
            );

        if (rows.length === 0) {

            await connection.rollback();

            return false;
        }

        const currentRequest = rows[0];

        // Validate using the current, locked request.
        const validatedData = await validateUpdate(
            currentRequest,
            requestData,
            connection
        );

        if (
            !validatedData ||
            typeof validatedData !== "object" ||
            Array.isArray(validatedData)
        ) {
            throw new Error(
                "Request validation must return update data."
            );
        }

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

        if (changes.length === 0) {

            await connection.commit();

            return true;
        }

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

        return true;

    } catch (error) {

        await connection.rollback();

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
