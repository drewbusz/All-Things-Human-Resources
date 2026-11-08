
const submissionService = require("../services/requestSubmissionService");

const errorStatuses = {
    INVALID_REQUEST_DATA: 400,
    INVALID_ACTING_EMPLOYEE: 400,
    INVALID_REQUEST_TYPE: 400,
    INVALID_SUMMARY: 400,
    ACTING_EMPLOYEE_NOT_AVAILABLE: 400,
    REQUEST_TYPE_NOT_AVAILABLE: 400,
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

// Get the request types available for submission
async function getActiveRequestTypes(req, res, next) {
    try {
        const types = await submissionService.getActiveRequestTypes();

        return res.status(200).json({
            success: true,
            data: types
        });
    } catch (error) {
        return handleError(error, res, next);
    }
}

// Create a new request
async function createRequest(req, res, next) {
    try {
        const authenticatedId = req.auth?.employeeId;

        // Production requests will need a signed-in employee
        if (process.env.NODE_ENV === "production" && !authenticatedId) {
            return res.status(401).json({
                success: false,
                message: "Sign-in is required to submit an HR request."
            });
        }

        const body = req.body;

        const data = {
            ...(
                body &&
                typeof body === "object" &&
                !Array.isArray(body)
                    ? body
                    : {}
            ),
            actingEmployeeId:
                authenticatedId ?? body?.actingEmployeeId
        };

        const created = await submissionService.createRequest(data);

        return res.status(201).json({
            success: true,
            message: "HR request submitted successfully.",
            data: created
        });
    } catch (error) {
        return handleError(error, res, next);
    }
}

module.exports = {
    getActiveRequestTypes,
    createRequest
};
