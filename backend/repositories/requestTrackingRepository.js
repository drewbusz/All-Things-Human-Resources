
const { pool } = require("../config/database");

// UC-6: requests submitted by one employee, including completed requests.
async function getEmployeeRequests(employeeId) {
    const [rows] = await pool.execute(
        `SELECT *
         FROM request_view
         WHERE employee_id = ?
         ORDER BY
             CASE WHEN status_code = 'complete' THEN 1 ELSE 0 END,
             submission_date DESC,
             request_id DESC`,
        [employeeId]
    );

    return rows;
}

async function getRequestNotes(requestId) {
    const [rows] = await pool.execute(
        `SELECT *
         FROM request_note_view
         WHERE request_id = ?
         ORDER BY note_date ASC, request_note_id ASC`,
        [requestId]
    );

    return rows;
}

// Save the note and its history entry together.
async function addRequestNote(requestId, employeeId, note, checkPermission) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            `SELECT r.request_id, r.employee_id, r.assigned_emp_id,
                    r.confidentiality_level, ws.step_code AS status_code
             FROM request r
             LEFT JOIN workflow_step ws
                 ON r.current_step_id = ws.workflow_step_id
             WHERE r.request_id = ?
             FOR UPDATE`,
            [requestId]
        );

        if (rows.length === 0) {
            const error = new Error("The HR request was not found.");
            error.code = "REQUEST_NOT_FOUND";
            throw error;
        }

        await checkPermission(rows[0], connection);

        const [result] = await connection.execute(
            `INSERT INTO request_notes (request_id, created_by_emp_id, note)
             VALUES (?, ?, ?)`,
            [requestId, employeeId, note]
        );

        await connection.execute(
            `INSERT INTO request_history
                 (request_id, created_by_emp_id, modified_field,
                  previous_value, current_value, type)
             VALUES (?, ?, 'request_note_added', '', ?, 'updated')`,
            [requestId, employeeId, String(result.insertId)]
        );

        await connection.commit();

        return {
            request_note_id: result.insertId,
            request_id: requestId,
            created_by_emp_id: employeeId,
            note
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    getEmployeeRequests,
    getRequestNotes,
    addRequestNote
};
