const { pool } = require("../config/database");


async function getEmployeesByAuthType(
    authTypeId
) {

    const sql = `
        SELECT DISTINCT
            e.employee_id,
            e.first_name,
            e.last_name,
            e.title,
            e.email_address,
            at.auth_type_id,
            at.auth_type_name

        FROM employee e

        INNER JOIN authorization a
            ON e.employee_id = a.employee_id

        INNER JOIN authorization_type at
            ON a.auth_type_id = at.auth_type_id

        WHERE a.auth_type_id = ?
          AND e.status = 'active'
          AND a.is_active = TRUE
          AND at.is_active = TRUE
          AND a.effective_date <= CURRENT_TIMESTAMP
          AND (
                a.expiration_date IS NULL
                OR a.expiration_date >= CURRENT_DATE
              )

        ORDER BY
            e.last_name ASC,
            e.first_name ASC
    `;


    const [rows] = await pool.execute(
        sql,
        [authTypeId]
    );


    return rows;
}


async function getEmployeeByIdAndAuthType(
    employeeId,
    authTypeId
) {

    const sql = `
        SELECT
            e.employee_id,
            e.first_name,
            e.last_name,
            e.title,
            e.email_address,
            at.auth_type_id,
            at.auth_type_name

        FROM employee e

        INNER JOIN authorization a
            ON e.employee_id = a.employee_id

        INNER JOIN authorization_type at
            ON a.auth_type_id = at.auth_type_id

        WHERE e.employee_id = ?
          AND a.auth_type_id = ?
          AND e.status = 'active'
          AND a.is_active = TRUE
          AND at.is_active = TRUE
          AND a.effective_date <= CURRENT_TIMESTAMP
          AND (
                a.expiration_date IS NULL
                OR a.expiration_date >= CURRENT_DATE
              )

        LIMIT 1
    `;


    const [rows] = await pool.execute(
        sql,
        [
            employeeId,
            authTypeId
        ]
    );


    if (rows.length === 0) {
        return null;
    }


    return rows[0];
}


async function getEmployeeAuthorizations(employeeId, connection = pool) {
    const sql = `
        SELECT a.auth_id, a.auth_type_id, at.can_view, at.can_update, at.can_approve
        FROM authorization a
        INNER JOIN authorization_type at ON a.auth_type_id = at.auth_type_id
        INNER JOIN employee e ON a.employee_id = e.employee_id
        WHERE a.employee_id = ?
          AND e.status = 'active'
          AND a.is_active = TRUE
          AND at.is_active = TRUE
          AND a.effective_date <= CURRENT_TIMESTAMP
          AND (a.expiration_date IS NULL OR a.expiration_date >= CURRENT_DATE)
    `;

    const [rows] = await connection.execute(sql, [employeeId]);
    return rows;
}


async function getEligibleHRAssignees() {
    const sql = `
        SELECT DISTINCT
            e.employee_id, e.first_name, e.last_name, e.title, e.email_address
        FROM employee e
        INNER JOIN authorization a ON e.employee_id = a.employee_id
        INNER JOIN authorization_type at ON a.auth_type_id = at.auth_type_id
        WHERE a.auth_type_id IN (3, 5, 6)
          AND e.status = 'active'
          AND a.is_active = TRUE
          AND at.is_active = TRUE
          AND at.can_view = TRUE
          AND at.can_update = TRUE
          AND a.effective_date <= CURRENT_TIMESTAMP
          AND (a.expiration_date IS NULL OR a.expiration_date >= CURRENT_DATE)
        ORDER BY e.last_name, e.first_name
    `;

    const [rows] = await pool.execute(sql);
    return rows;
}


module.exports = {
    getEmployeesByAuthType,
    getEmployeeByIdAndAuthType,
    getEmployeeAuthorizations,
    getEligibleHRAssignees
};
