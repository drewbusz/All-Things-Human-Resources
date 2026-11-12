
const managementService = require("../services/requestManagementService");

const errorStatuses = {
    INVALID_EMPLOYEE: 400,
    INVALID_REQUEST_ID: 400,
    INVALID_REQUEST_DATA: 400,
    INVALID_REQUEST_TYPE: 400,
    INVALID_ASSIGNEE: 400,
    INVALID_PRIORITY: 400,
    INVALID_DATE: 400,
    INVALID_CONFIDENTIALITY: 400,
    REQUEST_ACCESS_DENIED: 403,
    REQUEST_NOT_FOUND: 404,
    ASSIGNEE_NOT_ELIGIBLE: 409,
    REQUEST_COMPLETED: 409,
    REQUEST_FIELDS_CONFLICT: 409,
    REQUEST_RECLASSIFICATION_BLOCKED: 409,
    NO_INITIAL_WORKFLOW: 409,
    INTAKE_REVIEW_REQUIRED: 409
};

function handleError(error, res, next) {
    const status = errorStatuses[error.code];

    if (!status) return next(error);

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

// Get the active request list
async function getActiveRequests(req, res, next) {
    const employeeId = getActingEmployeeId(req, res);
    if (employeeId === null) return;

    try {
        const requests = await managementService.getActiveRequests(
            employeeId
        );

        return res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        return handleError(error, res, next);
    }
}

// Save assignment or classification changes
async function manageRequest(req, res, next) {
    const employeeId = getActingEmployeeId(req, res);
    if (employeeId === null) return;

    try {
        const body = req.body;

        const updates =
            body &&
            typeof body === "object" &&
            !Array.isArray(body)
                ? { ...body }
                : body;

        if (updates && !Array.isArray(updates)) {
            delete updates.actingEmployeeId;
        }

        const request = await managementService.manageRequest(
            req.params.id,
            employeeId,
            updates
        );

        return res.status(200).json({
            success: true,
            message: "Request assignment and classification saved.",
            data: request
        });
    } catch (error) {
        return handleError(error, res, next);
    }
}

module.exports = {
    getActiveRequests,
    manageRequest
};
