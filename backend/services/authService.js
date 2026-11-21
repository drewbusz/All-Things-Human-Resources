const crypto = require("node:crypto");
const { promisify } = require("node:util");
const { pool } = require("../config/database");
const employeeService = require("./employeeService");

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = await scrypt(password, salt, 64);
    return `scrypt$${salt}$${hash.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
    if (typeof password !== "string" || typeof storedHash !== "string") return false;
    const [algorithm, salt, hash] = storedHash.split("$");
    if (algorithm !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt || "") ||
        !/^[a-f0-9]{128}$/.test(hash || "")) return false;

    const expected = Buffer.from(hash, "hex");
    const actual = await scrypt(password, salt, expected.length);
    return crypto.timingSafeEqual(actual, expected);
}

// Workspaces are UI navigation only. API services still enforce permissions.
// All users get Employee; additional workspaces follow active roles.
function getWorkspaces(authorizations) {
    const types = new Set(authorizations.map(auth => Number(auth.auth_type_id)));
    const workspaces = ["employee"];

    if ([3, 5, 6].some(type => types.has(type))) workspaces.push("processing");
    if ([3, 5].some(type => types.has(type))) workspaces.push("authorized_staff");
    // Type 2 managers can view the workspace; approval actions still need can_approve.
    if ([2, 4, 5, 7].some(type => types.has(type))) workspaces.push("manager");

    return workspaces;
}

async function getCurrentEmployee(employeeId) {
    const [rows] = await pool.execute(`
        SELECT employee_id, first_name, last_name, title, email_address
        FROM employee
        WHERE employee_id = ? AND status = 'active'
        LIMIT 1
    `, [employeeId]);

    if (!rows.length) return null;

    const employee = rows[0];
    const authorizations = await employeeService.getEmployeeAuthorizations(employeeId);

    return {
        employeeId: Number(employee.employee_id),
        firstName: employee.first_name,
        lastName: employee.last_name,
        title: employee.title,
        email: employee.email_address,
        workspaces: getWorkspaces(authorizations)
    };
}

// Verify an active employee account and return its allowed workspaces.
async function login(email, password) {
    if (typeof email !== "string" || typeof password !== "string" ||
        !email.trim() || email.length > 254 || !password || password.length > 256) {
        return null;
    }

    const [rows] = await pool.execute(`
        SELECT e.employee_id, l.password_hash
        FROM employee e
        JOIN employee_login l ON l.employee_id = e.employee_id
        WHERE e.email_address = ? AND e.status = 'active'
        LIMIT 1
    `, [email.trim().toLowerCase()]);

    if (!rows.length || !(await verifyPassword(password, rows[0].password_hash))) {
        return null;
    }

    return getCurrentEmployee(Number(rows[0].employee_id));
}

module.exports = { login, getCurrentEmployee, getWorkspaces, hashPassword };