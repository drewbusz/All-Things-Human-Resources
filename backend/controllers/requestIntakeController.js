
const intakeService = require("../services/requestIntakeService");

const errorStatuses = {
    INVALID_EMPLOYEE: 400,
    INVALID_REQUEST_ID: 400,
    INVALID_REQUEST_TYPE: 400,
    INVALID_CONFIDENTIALITY: 400,
    INVALID_REQUEST_DATA: 400,
    INVALID_SUMMARY: 400,
    INVALID_EMAIL: 400,
    INVALID_SOURCE: 400,
    EMPLOYEE_NOT_FOUND: 400,
    REQUEST_ACCESS_DENIED: 403,
    REQUEST_NOT_FOUND: 404,
    REQUEST_ALREADY_REVIEWED: 409,
    REQUEST_ALREADY_ASSIGNED: 409,
    REQUEST_FIELDS_CONFLICT: 409,
    NO_INITIAL_WORKFLOW: 409
};

function handleError(error, res, next) {
    const status = errorStatuses[error.code];

    if (!status) {
        return next(error);
    }

    return res.status(status).json({
        success: false,
        message: error.message
    });
}

function getActingEmployeeId(req, res) {
    const authenticatedId = req.auth?.employeeId;

    if (process.env.NODE_ENV === "production" && !authenticatedId) {
        res.status(401).json({
            success: false,
            message: "Sign-in is required."
        });

        return null;
    }

    return authenticatedId ?? (
        req.method === "GET"
            ? req.query.actingEmployeeId
            : req.body?.actingEmployeeId
    );
}

// Get requests waiting for intake review
async function getPendingRequests(req, res, next) {
    const actingEmployeeId = getActingEmployeeId(req, res);
    if (actingEmployeeId === null) return;

    try {
        const requests = await intakeService.getPendingRequests(
            actingEmployeeId,
            req.query.source
        );

        return res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        return handleError(error, res, next);
    }
}

// Get one request for review
async function getIntakeRequest(req, res, next) {
    const actingEmployeeId = getActingEmployeeId(req, res);
    if (actingEmployeeId === null) return;

    try {
        const request = await intakeService.getIntakeRequest(
            req.params.id,
            actingEmployeeId
        );

        return res.status(200).json({
            success: true,
            data: request
        });
    } catch (error) {
        return handleError(error, res, next);
    }
}

// Verify or correct request classification
async function reviewRequest(req, res, next) {
    const actingEmployeeId = getActingEmployeeId(req, res);
    if (actingEmployeeId === null) return;

    try {
        const updated = await intakeService.reviewRequest(
            req.params.id,
            actingEmployeeId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Request intake review completed.",
            data: updated
        });
    } catch (error) {
        return handleError(error, res, next);
    }
}

// Create a request from simulated email information
async function createEmailRequest(req, res, next) {
    const actingEmployeeId = getActingEmployeeId(req, res);
    if (actingEmployeeId === null) return;

    try {
        const created = await intakeService.createEmailRequest(
            actingEmployeeId,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Email request received for HR review.",
            data: created
        });
    } catch (error) {
        return handleError(error, res, next);
    }
}

module.exports = {
    getPendingRequests,
    getIntakeRequest,
    reviewRequest,
    createEmailRequest
};
