// Run after database/auth_setup.sql. Re-running resets demo passwords.
const crypto = require("node:crypto");
const { pool } = require("../config/database");
const { hashPassword } = require("../services/authService");

async function main() {
    const [employees] = await pool.execute(`
        SELECT employee_id, email_address
        FROM employee
        WHERE status = 'active'
        ORDER BY employee_id
    `);

    console.log("Demo login credentials (save these privately):");

    // Each active employee gets a separate demo password.
    for (const employee of employees) {
        const password = crypto.randomBytes(12).toString("base64url");
        const passwordHash = await hashPassword(password);
        await pool.execute(`
            INSERT INTO employee_login (employee_id, password_hash)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)
        `, [employee.employee_id, passwordHash]);
        console.log(`${employee.email_address}  |  ${password}`);
    }
}

main().catch(error => {
    console.error("Could not create demo logins:", error.message);
    process.exitCode = 1;
}).finally(() => pool.end());