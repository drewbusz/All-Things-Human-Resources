
const employeeService = require("./employeeService");
const intakeRepository = require("../repositories/requestIntakeRepository");

const HR_TYPES = [3, 5];

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
        const number = Number(value);

        return Number.isSafeInteger(number)
            ? number
            : null;
    }

    return null;
}

function validateFields(data, allowedFields) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw serviceError(
            "Valid request information is required.",
            "INVALID_REQUEST_DATA"
        );
    }

    if (Object.keys(data).some(key => !allowedFields.includes(key))) {
        throw serviceError(
            "The request contains unsupported fields.",
            "INVALID_REQUEST_DATA"
        );
    }
}

// Check whether the employee can perform HR intake
async function requireAuthorizedHR(actingEmployeeId) {
    const employeeId = positiveId(actingEmployeeId);

    if (!employeeId) {
        throw serviceError(
            "A valid acting employee ID is required.",
            "INVALID_EMPLOYEE"
        );
    }

    const authorizations = await employeeService
        .getEmployeeAuthorizations(employeeId);

    const permitted = authorizations.some(auth =>
        HR_TYPES.includes(Number(auth.auth_type_id)) &&
        Boolean(auth.can_update)
    );

    if (!permitted) {
        throw serviceError(
            "You are not authorized to review incoming HR requests.",
            "REQUEST_ACCESS_DENIED"
        );
    }

    return employeeId;
}

// Get the pending intake queue
async function getPendingRequests(actingEmployeeId, source = "all") {
    await requireAuthorizedHR(actingEmployeeId);

    if (!["all", "self_service", "email_service"].includes(source)) {
        throw serviceError(
            "The selected intake source is invalid.",
            "INVALID_SOURCE"
        );
    }

    return intakeRepository.getPendingRequests(source);
}

// Get a request for intake review
async function getIntakeRequest(requestId, actingEmployeeId) {
    await requireAuthorizedHR(actingEmployeeId);

    const id = positiveId(requestId);

    if (!id) {
        throw serviceError(
            "A valid request ID is required.",
            "INVALID_REQUEST_ID"
        );
    }

    const request = await intakeRepository.getIntakeRequest(id);

    if (!request) {
        throw serviceError(
            "The request was not found or is not available for intake.",
            "REQUEST_NOT_FOUND"
        );
    }

    return request;
}

// Verify the request type and confidentiality
async function reviewRequest(requestId, actingEmployeeId, data) {
    const employeeId = await requireAuthorizedHR(actingEmployeeId);
    const id = positiveId(requestId);

    if (!id) {
        throw serviceError(
            "A valid request ID is required.",
            "INVALID_REQUEST_ID"
        );
    }

    validateFields(data, [
        "actingEmployeeId",
        "request_type_id",
        "confidentiality_level"
    ]);

    let requestTypeId;

    if (data.request_type_id !== undefined) {
        requestTypeId = positiveId(data.request_type_id);

        if (!requestTypeId) {
            throw serviceError(
                "A valid request type is required.",
                "INVALID_REQUEST_TYPE"
            );
        }
    }

    let confidentialityLevel;

    if (data.confidentiality_level !== undefined) {
        confidentialityLevel = data.confidentiality_level;

        if (!["Nonconfidential", "Confidential"].includes(confidentialityLevel)) {
            throw serviceError(
                "Select Nonconfidential or Confidential.",
                "INVALID_CONFIDENTIALITY"
            );
        }
    }

    return intakeRepository.reviewRequest(
        id,
        employeeId,
        {
            requestTypeId,
            confidentialityLevel
        }
    );
}

// Simulate a request received through an HR email inbox
async function createEmailRequest(actingEmployeeId, data) {
    const employeeId = await requireAuthorizedHR(actingEmployeeId);

    validateFields(data, [
        "actingEmployeeId",
        "employee_email",
        "request_type_id",
        "brief_summary"
    ]);

    const requestTypeId = positiveId(data.request_type_id);

    if (!requestTypeId) {
        throw serviceError(
            "A valid request type is required.",
            "INVALID_REQUEST_TYPE"
        );
    }

    if (
        typeof data.employee_email !== "string" ||
        data.employee_email.trim().length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.employee_email.trim())
    ) {
        throw serviceError(
            "A valid employee email address is required.",
            "INVALID_EMAIL"
        );
    }

    if (
        typeof data.brief_summary !== "string" ||
        !data.brief_summary.trim() ||
        data.brief_summary.trim().length > 2000
    ) {
        throw serviceError(
            "A summary between 1 and 2000 characters is required.",
            "INVALID_SUMMARY"
        );
    }

    return intakeRepository.createEmailRequest({
        actingEmployeeId: employeeId,
        employeeEmail: data.employee_email.trim().toLowerCase(),
        requestTypeId,
        briefSummary: data.brief_summary.trim()
    });
}

module.exports = {
    getPendingRequests,
    getIntakeRequest,
    reviewRequest,
    createEmailRequest
};
