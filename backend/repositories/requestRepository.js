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
    requestTypeId
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

    const [rows] = await pool.execute(
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


async function updateRequest(
    requestId,
    actingEmployeeId,
    requestData
) {

    const connection =
        await pool.getConnection();

    try {

        await connection.beginTransaction();


        /*
         * Lock and grab the current request.
         * Keep the date in YYYY-MM-DD format.
         */
        const [rows] =
            await connection.execute(
                `
                SELECT
                    request_id,
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


        /*
         * Start with the current values and
         * replace only what was sent.
         */
        const updatedRequest = {
            ...currentRequest,
            ...requestData
        };


        const trackedFields = [
            "assigned_emp_id",
            "current_step_id",
            "priority_level",
            "expected_completion",
            "brief_summary",
            "confidentiality_level"
        ];


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
         * Nothing changed, so nothing to save.
         */
        if (changes.length === 0) {

            await connection.commit();

            return true;
        }


        /*
         * Save the updated fields.
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
         * Log each change.
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
    updateRequest
};