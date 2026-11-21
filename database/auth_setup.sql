-- Run after your existing schema.sql and seed.sql.
-- This creates only the demo login table. It does not reset the database.
USE all_things_hr;

-- Store password hashes separately from employee profile records.
CREATE TABLE IF NOT EXISTS employee_login (
    employee_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    CONSTRAINT fk_employee_login_employee
        FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
        ON DELETE CASCADE
);