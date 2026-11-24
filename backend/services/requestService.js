const requestRepository = require("../repositories/requestRepository");
const employeeService = require("./employeeService");
const managementRepository = require("../repositories/requestManagementRepository");
const approvalService = require("./approvalService");

const {
    canAccessRequest,
    canViewUnassignedRequests,
    hasConfidentialPermission
} = require("../utils/requestPermissions");

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

    // Highly Confidential requests need their own request authorization.
    const isOwner = Number(request.employee_id) === Number(employeeId);
    let extraReadAccess = false;
    if (request.confidentiality_level === "Highly Confidential" && !isOwner) {
        const permissions = await requestRepository.getRequestAuthorizations(
            request.request_id,
            Number(employeeId),
            connection
        );

        if (!hasConfidentialPermission(permissions, operation)) {
            throw createServiceError(
                "You are not authorized to access this Highly Confidential request.",
                "REQUEST_ACCESS_DENIED"
            );
        }
        // A manually authorized HR processor may view but not process it.
        extraReadAccess = operation === "read" && permissions.some(
            permission => permission.request_auth_id != null && Boolean(permission.can_view)
        );
    }

    if (!canAccessRequest(authorizations, request, employeeId, operation) && !extraReadAccess) {
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

    if (!canViewUnassignedRequests(authorizations)) {
        throw createServiceError(
            "You are not authorized to view unassigned requests.",
            "REQUEST_ACCESS_DENIED"
        );
    }

    const requests = await requestRepository.getUnassignedRequests();
    const allowed = [];

    for (const request of requests) {
        // New submissions stay in intake until HR reviews them.
        if (await managementRepository.needsIntakeReview(request.request_id)) {
            continue;
        }

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

    if (data.current_step_id !== undefined &&
        !validId(data.current_step_id)) {
        throw createServiceError(
            "The selected workflow status is invalid.",
            "INVALID_STATUS"
        );
    }

    // Assignment, classification, and confidentiality are handled by UC-3.
    const allowedFields = [
        "current_step_id",
        "priority_level",
        "expected_completion",
        "brief_summary"
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
            await checkAccess(
                currentRequest,
                actingEmployeeId,
                "process",
                connection
            );

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

            // Completed requests are read-only.
            if (currentStep.step_code === "complete") {
                throw createServiceError(
                    "Completed requests cannot be updated.",
                    "INVALID_STATUS"
                );
            }

            // Processing begins after assignment.
            if (currentRequest.assigned_emp_id === null) {
                throw createServiceError(
                    "The request must be assigned before processing.",
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

                // UC-5 approval steps must be changed through the approval endpoints.
                if (nextNum > currentNum) {
                    await approvalService.checkProcessingTransition(
                        currentRequest, currentStep, nextStep, connection
                    );
                }
            }

            const editableFields = [
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