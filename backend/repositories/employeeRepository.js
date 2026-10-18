const { pool } = require("../config/database");


/*
 * Only active, currently effective authorizations count.
 * Authorization type 3 permits HR request modification,
 * type 5 provides full HR access, and type 6 permits
 * modification of requests assigned to that employee.
 * Request-level and confidentiality restrictions are
 * enforced by the request service, not this repository.
 */
const HR_PROCESSOR_AUTH_TYPES = [3, 5, 6];


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
        [employeeId, authTypeId]
    );

    return rows[0] || null;
}


/*
 * Return each current authorization for an employee.
 * A single employee can hold more than one authorization.
 */
async function getEmployeeAuthorizations(
    employeeId,
    connection = pool
) {

    const sql = `
        SELECT DISTINCT
            e.employee_id,
            e.first_name,
            e.last_name,
            e.title,
            e.email_address,
            a.auth_id,
            at.auth_type_id,
            at.auth_type_name,
            at.can_view,
            at.can_update,
            at.can_approve
        FROM employee e
        INNER JOIN authorization a
            ON e.employee_id = a.employee_id
        INNER JOIN authorization_type at
            ON a.auth_type_id = at.auth_type_id
        WHERE e.employee_id = ?
          AND e.status = 'active'
          AND a.is_active = TRUE
          AND at.is_active = TRUE
          AND a.effective_date <= CURRENT_TIMESTAMP
          AND (
                a.expiration_date IS NULL
                OR a.expiration_date >= CURRENT_DATE
              )
        ORDER BY at.auth_type_id ASC
    `;

    const [rows] = await connection.execute(
        sql,
        [employeeId]
    );

    return rows;
}


/*
 * An assignee must be an active HR processor.
 * SELECT DISTINCT avoids duplicate employees where
 * multiple active authorizations qualify them.
 */
async function getEligibleHRAssignees() {

    const sql = `
        SELECT DISTINCT
            e.employee_id,
            e.first_name,
            e.last_name,
            e.title,
            e.email_address
        FROM employee e
        INNER JOIN authorization a
            ON e.employee_id = a.employee_id
        INNER JOIN authorization_type at
            ON a.auth_type_id = at.auth_type_id
        WHERE a.auth_type_id IN (?, ?, ?)
          AND e.status = 'active'
          AND a.is_active = TRUE
          AND at.is_active = TRUE
          AND at.can_view = TRUE
          AND at.can_update = TRUE
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
        HR_PROCESSOR_AUTH_TYPES
    );

    return rows;
}


module.exports = {
    getEmployeesByAuthType,
    getEmployeeByIdAndAuthType,
    getEmployeeAuthorizations,
    getEligibleHRAssignees
};
