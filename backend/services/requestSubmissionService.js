
const submissionRepository = require("../repositories/requestSubmissionRepository");

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

// Get the active request types
async function getActiveRequestTypes() {
    return submissionRepository.getActiveRequestTypes();
}

// Validate and submit a new request
async function createRequest(data) {
    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw serviceError(
            "Request data must be a JSON object.",
            "INVALID_REQUEST_DATA"
        );
    }

    const allowedFields = new Set([
        "actingEmployeeId",
        "request_type_id",
        "brief_summary"
    ]);

    // Don't allow submission to set assignment or workflow details
    if (Object.keys(data).some(key => !allowedFields.has(key))) {
        throw serviceError(
            "The request contains unsupported fields.",
            "INVALID_REQUEST_DATA"
        );
    }

    const employeeId = positiveId(data.actingEmployeeId);
    const requestTypeId = positiveId(data.request_type_id);

    if (!employeeId) {
        throw serviceError(
            "A valid acting employee ID is required.",
            "INVALID_ACTING_EMPLOYEE"
        );
    }

    if (!requestTypeId) {
        throw serviceError(
            "A valid request type is required.",
            "INVALID_REQUEST_TYPE"
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

    return submissionRepository.createRequest({
        employeeId,
        requestTypeId,
        briefSummary: data.brief_summary.trim(),
        confidentialityLevel: "Confidential",
        intakeSource: "self_service"
    });
}

module.exports = {
    getActiveRequestTypes,
    createRequest
};
