
const employeeService = require("./employeeService");
const requestService = require("./requestService");
const managementRepository = require("../repositories/requestManagementRepository");

function serviceError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function positiveId(value) {
    if (typeof value === "number") {
        return Number.isSafeInteger(value) && value > 0
            ? value
            : null;
    }

    if (typeof value === "string" && /^[1-9]\d*$/.test(value)) {
        const id = Number(value);

        return Number.isSafeInteger(id)
            ? id
            : null;
    }

    return null;
}

function validDate(value) {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;
}

// Check HR permissions
async function requireHR(employeeId, needUpdate = false) {
    const id = positiveId(employeeId);

    if (!id) {
        throw serviceError(
            "A valid acting employee ID is required.",
            "INVALID_EMPLOYEE"
        );
    }

    const authorizations =
        await employeeService.getEmployeeAuthorizations(id);

    const authorized = authorizations.some(auth =>
        [3, 5].includes(Number(auth.auth_type_id)) &&
        Boolean(needUpdate ? auth.can_update : auth.can_view)
    );

    if (!authorized) {
        throw serviceError(
            "You are not authorized to manage HR requests.",
            "REQUEST_ACCESS_DENIED"
        );
    }

    return id;
}

// Get active requests the employee can access
async function getActiveRequests(employeeId) {
    const id = await requireHR(employeeId);
    const rows = await managementRepository.getActiveRequests();
    const visible = [];

    for (const row of rows) {
        try {
            await requestService.getRequestById(
                row.request_id,
                id
            );

            visible.push(row);
        } catch (error) {
            if (error.code !== "REQUEST_ACCESS_DENIED") {
                throw error;
            }
        }
    }

    return visible;
}

// Validate assignment and classification changes
async function manageRequest(requestId, employeeId, data) {
    const id = positiveId(requestId);

    if (!id) {
        throw serviceError(
            "A valid request ID is required.",
            "INVALID_REQUEST_ID"
        );
    }

    const actorId = await requireHR(employeeId, true);

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw serviceError(
            "Valid request information is required.",
            "INVALID_REQUEST_DATA"
        );
    }

    const allowed = new Set([
        "assigned_emp_id",
        "request_type_id",
        "priority_level",
        "expected_completion",
        "confidentiality_level"
    ]);

    const fields = Object.keys(data);

    if (
        fields.length === 0 ||
        fields.some(field => !allowed.has(field))
    ) {
        throw serviceError(
            "The request contains unsupported or missing fields.",
            "INVALID_REQUEST_DATA"
        );
    }

    const updates = { ...data };

    if ("assigned_emp_id" in updates) {
        updates.assigned_emp_id = positiveId(
            updates.assigned_emp_id
        );

        if (!updates.assigned_emp_id) {
            throw serviceError(
                "Select a valid HR employee.",
                "INVALID_ASSIGNEE"
            );
        }
    }

    if ("request_type_id" in updates) {
        updates.request_type_id = positiveId(
            updates.request_type_id
        );

        if (!updates.request_type_id) {
            throw serviceError(
                "Select a valid request type.",
                "INVALID_REQUEST_TYPE"
            );
        }
    }

    if ("priority_level" in updates) {
        if (updates.priority_level === "") {
            updates.priority_level = null;
        }

        if (
            ![null, "low", "medium", "high"].includes(
                updates.priority_level
            )
        ) {
            throw serviceError(
                "Priority must be low, medium, or high.",
                "INVALID_PRIORITY"
            );
        }
    }

    if ("expected_completion" in updates) {
        if (updates.expected_completion === "") {
            updates.expected_completion = null;
        }

        if (
            updates.expected_completion !== null &&
            !validDate(updates.expected_completion)
        ) {
            throw serviceError(
                "Enter a valid date in YYYY-MM-DD format.",
                "INVALID_DATE"
            );
        }
    }

    if (
        "confidentiality_level" in updates &&
        !["Nonconfidential", "Confidential"].includes(
            updates.confidentiality_level
        )
    ) {
        throw serviceError(
            "Select Nonconfidential or Confidential. Highly Confidential requires a separate workflow.",
            "INVALID_CONFIDENTIALITY"
        );
    }

    return managementRepository.manageRequest(
        id,
        actorId,
        updates
    );
}

module.exports = {
    getActiveRequests,
    manageRequest
};
