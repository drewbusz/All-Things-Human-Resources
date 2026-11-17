
const trackingRepository = require("../repositories/requestTrackingRepository");
const requestRepository = require("../repositories/requestRepository");
const requestService = require("./requestService");
const employeeService = require("./employeeService");

function serviceError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function validId(value) {
    return value !== null && value !== undefined && value !== "" &&
        Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

// The list is scoped to the employee's own submitted requests.
async function getMyRequests(actingEmployeeId) {
    if (!validId(actingEmployeeId)) {
        throw serviceError("A valid employee ID is required.", "INVALID_EMPLOYEE");
    }

    return trackingRepository.getEmployeeRequests(Number(actingEmployeeId));
}

// Reuse the existing read-access check, including confidentiality rules.
async function getRequestNotes(requestId, actingEmployeeId) {
    await requestService.getRequestById(requestId, actingEmployeeId);
    return trackingRepository.getRequestNotes(Number(requestId));
}

async function addRequestNote(requestId, actingEmployeeId, note) {
    if (!validId(requestId)) {
        throw serviceError("A valid request ID is required.", "INVALID_REQUEST_ID");
    }
    if (!validId(actingEmployeeId)) {
        throw serviceError("A valid employee ID is required.", "INVALID_EMPLOYEE");
    }
    if (typeof note !== "string" || !note.trim()) {
        throw serviceError("A note cannot be blank.", "INVALID_NOTE");
    }

    const id = Number(requestId);
    const employeeId = Number(actingEmployeeId);

    return trackingRepository.addRequestNote(
        id,
        employeeId,
        note.trim(),
        async (request, connection) => {
            const isOwner = Number(request.employee_id) === employeeId;

            if (!isOwner) {
                const auth = await employeeService.getEmployeeAuthorizations(
                    employeeId,
                    connection
                );
                const types = auth.map(a => Number(a.auth_type_id));
                const isAssigned = Number(request.assigned_emp_id) === employeeId;
                const canUpdate = types.includes(3) || types.includes(5) ||
                    (types.includes(6) && isAssigned);

                if (!canUpdate) {
                    throw serviceError(
                        "You cannot add a note to this request.",
                        "REQUEST_ACCESS_DENIED"
                    );
                }

                if (request.confidentiality_level === "Highly Confidential") {
                    const permissions = await requestRepository.getRequestAuthorizations(
                        id,
                        employeeId,
                        connection
                    );

                    if (!permissions.some(p => Boolean(p.can_update))) {
                        throw serviceError(
                            "You cannot update this Highly Confidential request.",
                            "REQUEST_ACCESS_DENIED"
                        );
                    }
                }
            }

            if (request.status_code === "complete") {
                throw serviceError(
                    "Notes cannot be added to a completed request.",
                    "REQUEST_COMPLETED"
                );
            }
        }
    );
}

module.exports = {
    getMyRequests,
    getRequestNotes,
    addRequestNote
};
