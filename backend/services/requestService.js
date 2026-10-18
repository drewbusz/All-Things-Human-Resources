const requestRepository = require("../repositories/requestRepository");
const employeeService = require("./employeeService");

const HR_TYPES = [3, 5, 6];
const ASSIGNMENT_TYPES = [3, 5];

function createServiceError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function validId(value) {
    return value !== null &&
        value !== undefined &&
        value !== "" &&
        Number.isSafeInteger(Number(value)) &&
        Number(value) > 0;
}

function isValidDate(value) {
    if (typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;
}

async function checkAccess(request, employeeId, operation, connection) {
    if (!validId(employeeId)) {
        throw createServiceError(
            "A valid acting employee ID is required.",
            "INVALID_EMPLOYEE"
        );
    }

    const authorizations = await employeeService
        .getEmployeeAuthorizations(Number(employeeId), connection);

    const types = authorizations.map(a => Number(a.auth_type_id));
    const assigned = Number(request.assigned_emp_id) === Number(employeeId);
    const submitted = Number(request.employee_id) === Number(employeeId);

    const generalHR = types.includes(3) || types.includes(5);
    const assignedHR = types.includes(6) && assigned;
    const hrAccess = generalHR || assignedHR;

    const confidentiality = request.confidentiality_level;

    if (confidentiality === "Highly Confidential") {
        if (!submitted) {
            const permissions = await requestRepository
                .getRequestAuthorizations(
                    request.request_id,
                    Number(employeeId),
                    connection
                );

            const field = operation === "read" ? "can_view" : "can_update";

            if (!permissions.some(p => Boolean(p[field]))) {
                throw createServiceError(
                    "You are not authorized to access this Highly Confidential request.",
                    "REQUEST_ACCESS_DENIED"
                );
            }
        }
    }

    let allowed = false;

    if (operation === "read") {
        allowed = submitted || hrAccess;
    } else if (operation === "assign") {
        allowed = types.some(t => ASSIGNMENT_TYPES.includes(t));
    } else if (operation === "process") {
        allowed = types.includes(5) ||
            (assigned && types.some(t => HR_TYPES.includes(t)));
    }

    if (!allowed) {
        throw createServiceError(
            "You are not authorized to perform this operation.",
            "REQUEST_ACCESS_DENIED"
        );
    }
}

async function getRequestById(requestId, actingEmployeeId) {
    if (!validId(requestId)) {
        throw createServiceError(
            "A valid request ID is required.",
            "INVALID_REQUEST_ID"
        );
    }

    const request = await requestRepository.getRequestById(Number(requestId));

    if (!request) {
        throw createServiceError(
            "The HR request was not found.",
            "REQUEST_NOT_FOUND"
        );
    }

    await checkAccess(request, actingEmployeeId, "read");
    return request;
}

async function getWorkflowStepsByRequestType(requestTypeId) {
    if (!validId(requestTypeId)) {
        throw createServiceError(
            "A valid request type ID is required.",
            "INVALID_REQUEST_TYPE"
        );
    }

    return requestRepository.getWorkflowStepsByRequestType(
        Number(requestTypeId)
    );
}

async function getRequestHistoryByRequestId(requestId, actingEmployeeId) {
    await getRequestById(requestId, actingEmployeeId);

    return requestRepository.getRequestHistoryByRequestId(
        Number(requestId)
    );
}

async function getAssignedRequestsByEmpId(employeeId, actingEmployeeId) {
    if (!validId(employeeId) || !validId(actingEmployeeId)) {
        throw createServiceError(
            "A valid employee ID is required.",
            "INVALID_EMPLOYEE"
        );
    }

    if (Number(employeeId) !== Number(actingEmployeeId)) {
        throw createServiceError(
            "You may only view your own assigned requests.",
            "REQUEST_ACCESS_DENIED"
        );
    }

    const requests = await requestRepository
        .getAssignedRequestsByEmpId(Number(employeeId));

    const allowed = [];

    for (const request of requests) {
        try {
            await checkAccess(request, actingEmployeeId, "read");
            allowed.push(request);
        } catch (error) {
            if (error.code !== "REQUEST_ACCESS_DENIED") {
                throw error;
            }
        }
    }

    return allowed;
}

async function getUnassignedRequests(actingEmployeeId) {
    if (!validId(actingEmployeeId)) {
        throw createServiceError(
            "A valid acting employee ID is required.",
            "INVALID_EMPLOYEE"
        );
    }

    const authorizations = await employeeService
        .getEmployeeAuthorizations(Number(actingEmployeeId));

    if (!authorizations.some(a =>
        ASSIGNMENT_TYPES.includes(Number(a.auth_type_id))
    )) {
        throw createServiceError(
            "You are not authorized to view unassigned requests.",
            "REQUEST_ACCESS_DENIED"
        );
    }

    const requests = await requestRepository.getUnassignedRequests();
    const allowed = [];

    for (const request of requests) {
        try {
            await checkAccess(request, actingEmployeeId, "read");
            allowed.push(request);
        } catch (error) {
            if (error.code !== "REQUEST_ACCESS_DENIED") {
                throw error;
            }
        }
    }

    return allowed;
}

async function updateRequest(requestId, actingEmployeeId, requestData) {
    if (!validId(requestId) || !validId(actingEmployeeId)) {
        throw createServiceError(
            "Valid request and employee IDs are required.",
            "INVALID_EMPLOYEE"
        );
    }

    if (!requestData || typeof requestData !== "object" ||
        Array.isArray(requestData)) {
        throw createServiceError(
            "Valid request information is required.",
            "INVALID_REQUEST_DATA"
        );
    }

    const data = { ...requestData };

    if (data.brief_summary !== undefined) {
        if (typeof data.brief_summary !== "string" ||
            !data.brief_summary.trim()) {
            throw createServiceError(
                "A request summary is required.",
                "INVALID_SUMMARY"
            );
        }

        data.brief_summary = data.brief_summary.trim();
    }

    if (data.priority_level === "") {
        data.priority_level = null;
    }

    if (data.priority_level !== undefined &&
        ![null, "low", "medium", "high"].includes(data.priority_level)) {
        throw createServiceError(
            "Priority must be low, medium, high, or blank.",
            "INVALID_PRIORITY"
        );
    }

    if (data.expected_completion === "") {
        data.expected_completion = null;
    }

    if (data.expected_completion !== undefined &&
        data.expected_completion !== null &&
        !isValidDate(data.expected_completion)) {
        throw createServiceError(
            "Expected completion must be a valid date in YYYY-MM-DD format.",
            "INVALID_DATE"
        );
    }

    if (data.assigned_emp_id !== undefined &&
        !validId(data.assigned_emp_id)) {
        throw createServiceError(
            "The assigned employee ID is invalid.",
            "INVALID_EMPLOYEE"
        );
    }

    if (data.current_step_id !== undefined &&
        !validId(data.current_step_id)) {
        throw createServiceError(
            "The selected workflow status is invalid.",
            "INVALID_STATUS"
        );
    }

    const allowedFields = [
        "request_type_id",
        "assigned_emp_id",
        "current_step_id",
        "priority_level",
        "expected_completion",
        "brief_summary",
        "confidentiality_level"
    ];

    if (Object.keys(data).some(field => !allowedFields.includes(field))) {
        throw createServiceError(
            "The request contains an unsupported field.",
            "INVALID_REQUEST_DATA"
        );
    }

    const updated = await requestRepository.updateRequest(
        Number(requestId),
        Number(actingEmployeeId),
        data,
        async (currentRequest, submittedData, connection) => {
            if (submittedData.request_type_id !== undefined &&
                Number(submittedData.request_type_id) !==
                Number(currentRequest.request_type_id)) {
                throw createServiceError(
                    "The request type cannot be changed here.",
                    "INVALID_REQUEST_TYPE"
                );
            }

            if (submittedData.confidentiality_level !== undefined &&
                submittedData.confidentiality_level !==
                currentRequest.confidentiality_level) {
                throw createServiceError(
                    "Confidentiality cannot be changed through this form.",
                    "REQUEST_ACCESS_DENIED"
                );
            }

            const assignmentChanging =
                submittedData.assigned_emp_id !== undefined &&
                Number(submittedData.assigned_emp_id) !==
                Number(currentRequest.assigned_emp_id);

            const operation = assignmentChanging ? "assign" : "process";

            await checkAccess(
                currentRequest,
                actingEmployeeId,
                operation,
                connection
            );

            if (assignmentChanging) {
                if (submittedData.brief_summary !== undefined ||
                    submittedData.current_step_id !== undefined) {
                    throw createServiceError(
                        "Assignment cannot modify processing fields.",
                        "REQUEST_ACCESS_DENIED"
                    );
                }

                const eligible = await employeeService
                    .isEligibleHRAssignee(
                        Number(submittedData.assigned_emp_id),
                        connection
                    );

                if (!eligible) {
                    throw createServiceError(
                        "The selected employee is not eligible for HR assignment.",
                        "EMPLOYEE_NOT_AUTHORIZED"
                    );
                }

                if (currentRequest.confidentiality_level ===
                    "Highly Confidential") {
                    const permissions = await requestRepository
                        .getRequestAuthorizations(
                            currentRequest.request_id,
                            Number(submittedData.assigned_emp_id),
                            connection
                        );

                    if (!permissions.some(p => Boolean(p.can_update))) {
                        throw createServiceError(
                            "The assignee requires explicit access to this Highly Confidential request.",
                            "REQUEST_ACCESS_DENIED"
                        );
                    }
                }
            }

            const steps = await requestRepository
                .getWorkflowStepsByRequestType(
                    currentRequest.request_type_id,
                    connection
                );

            const currentStep = steps.find(step =>
                Number(step.workflow_step_id) ===
                Number(currentRequest.current_step_id)
            );

            if (!currentStep) {
                throw createServiceError(
                    "The request has an invalid current workflow step.",
                    "INVALID_STATUS"
                );
            }

            if (submittedData.current_step_id !== undefined) {
                const nextStep = steps.find(step =>
                    Number(step.workflow_step_id) ===
                    Number(submittedData.current_step_id)
                );

                if (!nextStep) {
                    throw createServiceError(
                        "The selected status does not belong to this workflow.",
                        "INVALID_STATUS"
                    );
                }

                const currentNum = Number(currentStep.step_num);
                const nextNum = Number(nextStep.step_num);

                if (nextNum < currentNum) {
                    throw createServiceError(
                        "A request cannot move backward in its workflow.",
                        "INVALID_STATUS"
                    );
                }

                if (nextNum > currentNum + 1) {
                    throw createServiceError(
                        "A request cannot skip workflow steps.",
                        "INVALID_STATUS"
                    );
                }
            }

            const editableFields = [
                "assigned_emp_id",
                "current_step_id",
                "priority_level",
                "expected_completion",
                "brief_summary"
            ];

            const updateData = {};

            for (const field of editableFields) {
                if (Object.prototype.hasOwnProperty.call(submittedData, field)) {
                    updateData[field] = submittedData[field];
                }
            }

            return updateData;
        }
    );

    if (!updated) {
        throw createServiceError(
            "The HR request could not be updated.",
            "UPDATE_FAILED"
        );
    }

    // The acting employee was authorized before the update committed.
    return requestRepository.getRequestById(Number(requestId));
}

module.exports = {
    getRequestById,
    getWorkflowStepsByRequestType,
    getRequestHistoryByRequestId,
    getAssignedRequestsByEmpId,
    getUnassignedRequests,
    updateRequest
};
