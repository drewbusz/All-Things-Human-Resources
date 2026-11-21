const { pool } = require("../config/database");
const employeeService = require("./employeeService");
const requestService = require("./requestService");
const requestRepository = require("../repositories/requestRepository");
const {
    canAccessRequest,
    hasConfidentialPermission
} = require("../utils/requestPermissions");

function fieldError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function validId(value) {
    return value !== null && value !== undefined && value !== "" &&
        Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

async function getTypeDefinitions(requestTypeId, connection = pool) {
    if (!validId(requestTypeId)) {
        throw fieldError("A valid request type ID is required.", "INVALID_REQUEST_TYPE");
    }

    const [types] = await connection.execute(`
        SELECT request_type_id FROM request_type
        WHERE request_type_id = ? AND is_active = TRUE LIMIT 1
    `, [Number(requestTypeId)]);

    if (!types.length) {
        throw fieldError("The request type is not available.", "REQUEST_TYPE_NOT_AVAILABLE");
    }

    const [fields] = await connection.execute(`
        SELECT field_id, request_type_id, field_name, field_label,
               field_type, is_required, display_order
        FROM request_type_field
        WHERE request_type_id = ?
        ORDER BY display_order, field_id
    `, [Number(requestTypeId)]);
    return fields;
}

// Validate the existing field_id/field_val format used by the frontend.
function validateFieldValues(definitions, fieldValues, requireAll = false) {
    if (!Array.isArray(fieldValues)) {
        throw fieldError("fieldValues must be an array.", "INVALID_FIELD_VALUES");
    }

    const known = new Map(definitions.map(field => [Number(field.field_id), field]));
    const seen = new Set();
    const normalized = [];

    for (const entry of fieldValues) {
        if (!entry || typeof entry !== "object" || Array.isArray(entry) ||
            !Object.keys(entry).every(key => ["field_id", "field_val"].includes(key)) ||
            !validId(entry.field_id) || !Object.prototype.hasOwnProperty.call(entry, "field_val")) {
            throw fieldError("Each field needs a valid field_id and field_val.", "INVALID_FIELD_VALUES");
        }

        const fieldId = Number(entry.field_id);
        const definition = known.get(fieldId);
        if (!definition || seen.has(fieldId)) {
            throw fieldError("A field is invalid or was submitted twice.", "INVALID_FIELD_VALUES");
        }
        seen.add(fieldId);

        if (entry.field_val !== null && typeof entry.field_val !== "string" &&
            typeof entry.field_val !== "number") {
            throw fieldError("Field values must be text, numbers, or null.", "INVALID_FIELD_VALUES");
        }

        const value = entry.field_val === null ? null : String(entry.field_val).trim() || null;
        if (value !== null && value.length > 255) {
            throw fieldError(`${definition.field_label} must be 255 characters or fewer.`, "INVALID_FIELD_VALUES");
        }
        if (value === null && Boolean(definition.is_required)) {
            throw fieldError(`${definition.field_label} is required.`, "REQUIRED_FIELD_MISSING");
        }
        if (value !== null && definition.field_type === "date" && !validDate(value)) {
            throw fieldError(`${definition.field_label} must be a valid YYYY-MM-DD date.`, "INVALID_FIELD_VALUES");
        }
        if (value !== null && definition.field_type === "number" &&
            !/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) {
            throw fieldError(`${definition.field_label} must be a number.`, "INVALID_FIELD_VALUES");
        }
        normalized.push({ field_id: fieldId, field_name: definition.field_name, field_val: value });
    }

    if (requireAll) {
        for (const definition of definitions) {
            if (Boolean(definition.is_required) && !seen.has(Number(definition.field_id))) {
                throw fieldError(`${definition.field_label} is required.`, "REQUIRED_FIELD_MISSING");
            }
        }
    }
    return normalized;
}

// Save values and field history in the caller's transaction.
async function saveNormalizedFieldValues(connection, requestId, employeeId, normalized) {
    const [existing] = await connection.execute(`
        SELECT field_id, field_val FROM request_field_value
        WHERE request_id = ? FOR UPDATE
    `, [requestId]);
    const previous = new Map(existing.map(row => [Number(row.field_id), row.field_val]));
    let changed = 0;

    for (const field of normalized) {
        const before = previous.has(field.field_id) ? previous.get(field.field_id) : null;
        if (before === field.field_val) continue;

        await connection.execute(`
            INSERT INTO request_field_value (field_id, request_id, field_val)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE field_val = VALUES(field_val), value_date = CURRENT_TIMESTAMP
        `, [field.field_id, requestId, field.field_val]);

        await connection.execute(`
            INSERT INTO request_history (
                request_id, created_by_emp_id, modified_field,
                previous_value, current_value, type
            ) VALUES (?, ?, ?, ?, ?, 'updated')
        `, [
            requestId, employeeId,
            `field:${field.field_name}`.slice(0, 255),
            String(before ?? "").slice(0, 255),
            String(field.field_val ?? "").slice(0, 255)
        ]);
        changed++;
    }
    return changed;
}

async function getRequestFields(requestId, employeeId) {
    if (!validId(requestId)) {
        throw fieldError("A valid request ID is required.", "INVALID_REQUEST_ID");
    }
    // Existing request read permissions also cover Highly Confidential requests.
    const request = await requestService.getRequestById(Number(requestId), employeeId);
    const [fields] = await pool.execute(`
        SELECT f.field_id, f.request_type_id, f.field_name, f.field_label,
               f.field_type, f.is_required, f.display_order,
               v.field_val, v.value_date
        FROM request_type_field f
        LEFT JOIN request_field_value v
            ON v.field_id = f.field_id AND v.request_id = ?
        WHERE f.request_type_id = ?
        ORDER BY f.display_order, f.field_id
    `, [Number(requestId), Number(request.request_type_id)]);
    return fields;
}

async function saveRequestFields(requestId, employeeId, fieldValues) {
    if (!validId(requestId) || !validId(employeeId)) {
        throw fieldError("Valid request and employee IDs are required.", "INVALID_REQUEST_ID");
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(`
            SELECT r.request_id, r.request_type_id, r.employee_id,
                   r.assigned_emp_id, r.confidentiality_level, ws.step_code
            FROM request r
            LEFT JOIN workflow_step ws ON ws.workflow_step_id = r.current_step_id
            WHERE r.request_id = ? FOR UPDATE
        `, [Number(requestId)]);
        if (!rows.length) {
            throw fieldError("The request was not found.", "REQUEST_NOT_FOUND");
        }
        const request = rows[0];
        if (request.step_code === "complete") {
            throw fieldError("Completed requests cannot be changed.", "REQUEST_COMPLETED");
        }
        // Don't change submitted details while the manager's decision is pending/reviewed.
        if (["approval", "review_approval"].includes(request.step_code)) {
            throw fieldError("Request fields cannot change during manager approval.", "REQUEST_FIELDS_LOCKED");
        }

        const ownerCanEdit = Number(request.employee_id) === Number(employeeId) &&
            request.assigned_emp_id === null;
        const auth = await employeeService.getEmployeeAuthorizations(Number(employeeId), connection);
        const staffCanEdit = canAccessRequest(auth, request, employeeId, "process");
        if (!ownerCanEdit && !staffCanEdit) {
            throw fieldError("You cannot edit fields on this request.", "REQUEST_ACCESS_DENIED");
        }
        if (request.confidentiality_level === "Highly Confidential" && !ownerCanEdit) {
            const permissions = await requestRepository.getRequestAuthorizations(
                Number(requestId), Number(employeeId), connection
            );
            if (!hasConfidentialPermission(permissions, "update")) {
                throw fieldError("Request authorization is required.", "REQUEST_ACCESS_DENIED");
            }
        }

        const definitions = await getTypeDefinitions(request.request_type_id, connection);
        const normalized = validateFieldValues(definitions, fieldValues);
        const changed = await saveNormalizedFieldValues(
            connection, Number(requestId), Number(employeeId), normalized
        );
        await connection.commit();
        return { request_id: Number(requestId), updated_fields: changed };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    getTypeDefinitions,
    getRequestFields,
    saveRequestFields,
    validateFieldValues,
    saveNormalizedFieldValues
};