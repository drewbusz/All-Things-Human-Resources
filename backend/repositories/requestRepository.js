const { pool } = require("../config/database");


async function getRequestById(
    requestId,
    employeeId
) {

    const sql = `
        SELECT
            r.request_id,
            r.submission_date,
            r.employee_id,
            r.request_type_id,
            r.assigned_emp_id,
            r.current_step_id,
            r.priority_level,
            r.confidentiality_level,
            r.intake_source,
            r.expected_completion,
            r.brief_summary,

            rt.name AS request_type,

            ws.step_name AS status,
            ws.step_code AS status_code,
            ws.step_num AS current_step_num

        FROM request r

        INNER JOIN request_type rt
            ON r.request_type_id = rt.request_type_id

        LEFT JOIN workflow_step ws
            ON r.current_step_id = ws.workflow_step_id

        WHERE r.request_id = ?
          AND r.assigned_emp_id = ?
    `;


    const [rows] = await pool.execute(
        sql,
        [
            requestId,
            employeeId
        ]
    );


    if (rows.length === 0) {

        return null;
    }


    return rows[0];
}


async function getWorkflowStepByName(
    requestTypeId,
    statusName
) {

    const sql = `
        SELECT
            workflow_step_id,
            request_type_id,
            step_name,
            step_num,
            step_code,
            is_active

        FROM workflow_step

        WHERE request_type_id = ?
          AND LOWER(step_name) = LOWER(?)
          AND is_active = TRUE

        LIMIT 1
    `;


    const [rows] = await pool.execute(
        sql,
        [
            requestTypeId,
            statusName
        ]
    );


    if (rows.length === 0) {

        return null;
    }


    return rows[0];
}


async function updateRequestWorkflowStep(
    requestId,
    workflowStepId,
    employeeId
) {

    const connection = await pool.getConnection();

    try {

        await connection.beginTransaction();


        const updateSql = `
            UPDATE request

            SET current_step_id = ?

            WHERE request_id = ?
              AND assigned_emp_id = ?
        `;


        const [updateResult] =
            await connection.execute(
                updateSql,
                [
                    workflowStepId,
                    requestId,
                    employeeId
                ]
            );


        if (updateResult.affectedRows !== 1) {

            await connection.rollback();

            return false;
        }


        /*
         * The current database schema only stores
         * request_id and created_by_emp_id in request_history.
         *
         * This records that the employee performed an update.
         * The insert should be expanded when request_history
         * is updated to include the audit fields documented
         * in the project design.
         */

        const historySql = `
            INSERT INTO request_history (
                request_id,
                created_by_emp_id
            )

            VALUES (?, ?)
        `;


        await connection.execute(
            historySql,
            [
                requestId,
                employeeId
            ]
        );


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
    getWorkflowStepByName,
    updateRequestWorkflowStep
};