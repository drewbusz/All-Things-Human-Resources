const requestRepository = require("../repositories/requestRepository");
const employeeService = require("./employeeService");

const PROCESSOR_TYPES = [3, 5, 6];
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

function isValidDate(dateValue) {
    if (
        typeof dateValue !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
        return false;
    }

    const [year, month, day] = dateValue.split("-").map(Number);
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

    const types = authorizations.map(
        auth => Number(auth.auth_type_id)
    );

    const assigned = Number(request.assigned_emp_id) === Number(employeeId);
    const submitted = Number(request.employee_id) === Number(employeeId);

    const fullAccess = types.includes(5);
    const generalAccess = types.includes(3) || fullAccess;
    const assignedAccess = types.includes(6) && assigned;

    if (request.confidentiality_level === "Highly Confidential") {
        if (!submitted) {
            const permissions = await requestRepository
                .getRequestAuthorizations(
                    request.request_id,
                    employeeId,
                    connection
                );

            const requiredPermission =
                operation === "read" ? "can_view" : "can_update";

            if (!permissions.some(p => Boolean(p[requiredPermission]))) {
                throw createServiceError(
                    "You are not authorized to access this Highly Confidential request.",
                    "REQUEST_ACCESS_DENIED"
                );
            }
        }
    }

    let allowed = false;

    if (operation === "read") {
        allowed = submitted || generalAccess || assignedAccess;
    } else if (operation === "assign") {
        allowed = types.some(type => ASSIGNMENT_TYPES.includes(type));
    } else if (operation === "process") {
        allowed = fullAccess || (
            assigned && types.some(type => PROCESSOR_TYPES.includes(type))
        );
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

    const request = await requestRepository.getRequestById(requestId);

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
    return await requestRepository
        .getWorkflowStepsByRequestType(requestTypeId);
}

async function getRequestHistoryByRequestId(requestId, actingEmployeeId) {
    await getRequestById(requestId, actingEmployeeId);

    return await requestRepository
        .getRequestHistoryByRequestId(requestId);
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
        .getAssignedRequestsByEmpId(employeeId);

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

    if (!authorizations.some(
        auth => ASSIGNMENT_TYPES.includes(Number(auth.auth_type_id))
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
            "A valid request and acting employee ID are required.",
            "INVALID_EMPLOYEE"
        );
    }

    if (
        !requestData ||
        typeof requestData !== "object" ||
        Array.isArray(requestData)
    ) {
        throw createServiceError(
            "Valid request information is required.",
            "INVALID_REQUEST_DATA"
        );
    }

    const data = { ...requestData };

    if (data.brief_summary !== undefined) {
        if (
            typeof data.brief_summary !== "string" ||
            !data.brief_summary.trim()
        ) {
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

    if (
        data.priority_level !== undefined &&
        ![null, "low", "medium", "high"].includes(data.priority_level)
    ) {
        throw createServiceError(
            "Priority must be low, medium, high, or blank.",
            "INVALID_PRIORITY"
        );
    }

    if (data.expected_completion === "") {
        data.expected_completion = null;
    }

    if (
        data.expected_completion !== undefined &&
        data.expected_completion !== null &&
        !isValidDate(data.expected_completion)
    ) {
        throw createServiceError(
            "Expected completion must be a valid date in YYYY-MM-DD format.",
            "INVALID_DATE"
        );
    }

    if (
        data.assigned_emp_id !== undefined &&
        !validId(data.assigned_emp_id)
    ) {
        throw createServiceError(
            "The assigned employee ID is invalid.",
            "INVALID_EMPLOYEE"
        );
    }

    if (
        data.current_step_id !== undefined &&
        !validId(data.current_step_id)
    ) {
        throw createServiceError(
            "The selected workflow status is invalid.",
            "INVALID_STATUS"
        );
    }

    const updated = await requestRepository.updateRequest(
        Number(requestId),
        Number(actingEmployeeId),
        data,
        async (currentRequest, submittedData, connection) => {
            if (
                submittedData.request_type_id !== undefined &&
                Number(submittedData.request_type_id) !==
                Number(currentRequest.request_type_id)
            ) {
                throw createServiceError(
                    "The request type does not match this HR request.",
                    "INVALID_REQUEST_TYPE"
                );
            }

            // Regular processing cannot change confidentiality.
            if (
                submittedData.confidentiality_level !== undefined &&
                submittedData.confidentiality_level !==
                currentRequest.confidentiality_level
            ) {
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
                const eligible = await employeeService
                    .isEligibleHRAssignee(
                        Number(submittedData.assigned_emp_id),
                        connection
                    );

                if (!eligible) {
                    throw createServiceError(
                        "The selected employee is not authorized to process HR requests.",
                        "EMPLOYEE_NOT_AUTHORIZED"
                    );
                }
            }

            const steps = await requestRepository
                .getWorkflowStepsByRequestType(
                    currentRequest.request_type_id,
                    connection
                );

            const currentStep = steps.find(
                step => Number(step.workflow_step_id) ===
                    Number(currentRequest.current_step_id)
            );

            if (!currentStep) {
                throw createServiceError(
                    "The request has an invalid current workflow step.",
                    "INVALID_STATUS"
                );
            }

            if (submittedData.current_step_id !== undefined) {
                const nextStep = steps.find(
                    step => Number(step.workflow_step_id) ===
                        Number(submittedData.current_step_id)
                );

                if (!nextStep) {
                    throw createServiceError(
                        "The selected status does not belong to this request workflow.",
                        "INVALID_STATUS"
                    );
                }

                if (nextStep.step_num < currentStep.step_num) {
                    throw createServiceError(
                        "A request cannot move backward in its workflow.",
                        "INVALID_STATUS"
                    );
                }

                if (nextStep.step_num > currentStep.step_num + 1) {
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

    return await getRequestById(requestId, actingEmployeeId);
}

module.exports = {
    getRequestById,
    getWorkflowStepsByRequestType,
    getRequestHistoryByRequestId,
    getAssignedRequestsByEmpId,
    getUnassignedRequests,
    updateRequest
};
