const { pool } = require("../config/database");


async function getRequestById(requestId) {

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
            ws.step_code AS status_code

        FROM Request r

        INNER JOIN Request_Type rt
            ON r.request_type_id = rt.request_type_id

        INNER JOIN Workflow_Step ws
            ON r.current_step_id = ws.workflow_step_id

        WHERE r.request_id = ?
    `;

    const [rows] = await pool.execute(sql, [requestId]);

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

        FROM Workflow_Step

        WHERE request_type_id = ?
          AND LOWER(step_name) = LOWER(?)
          AND is_active = 1

        LIMIT 1
    `;

    const [rows] = await pool.execute(
        sql,
        [requestTypeId, statusName]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
}


async function updateRequestWorkflowStep(
    requestId,
    workflowStepId
) {

    const sql = `
        UPDATE Request

        SET current_step_id = ?

        WHERE request_id = ?
    `;

    const [result] = await pool.execute(
        sql,
        [workflowStepId, requestId]
    );

    return result.affectedRows;
}


module.exports = {
    getRequestById,
    getWorkflowStepByName,
    updateRequestWorkflowStep
};