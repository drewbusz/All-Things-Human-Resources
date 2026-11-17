
const trackingService = require("../services/requestTrackingService");

const errorStatuses = {
    INVALID_EMPLOYEE: 400,
    INVALID_REQUEST_ID: 400,
    INVALID_NOTE: 400,
    REQUEST_ACCESS_DENIED: 403,
    REQUEST_NOT_FOUND: 404,
    REQUEST_COMPLETED: 409
};

function handleError(error, res, next) {
    const status = errorStatuses[error.code];
    if (!status) return next(error);

    return res.status(status).json({
        success: false,
        message: error.message
    });
}

// Consistent with the project's development test-user approach.
// Production requests require authenticated identity when added later.
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
            : req.body?.actingEmployeeId ?? req.query.actingEmployeeId
    );
}

async function getMyRequests(req, res, next) {
    const employeeId = getActingEmployeeId(req, res);
    if (employeeId === null) return;

    try {
        const requests = await trackingService.getMyRequests(employeeId);
        return res.status(200).json({ success: true, data: requests });
    } catch (error) {
        return handleError(error, res, next);
    }
}

async function getRequestNotes(req, res, next) {
    const employeeId = getActingEmployeeId(req, res);
    if (employeeId === null) return;

    try {
        const notes = await trackingService.getRequestNotes(
            req.params.id,
            employeeId
        );
        return res.status(200).json({ success: true, data: notes });
    } catch (error) {
        return handleError(error, res, next);
    }
}

async function addRequestNote(req, res, next) {
    const employeeId = getActingEmployeeId(req, res);
    if (employeeId === null) return;

    try {
        const saved = await trackingService.addRequestNote(
            req.params.id,
            employeeId,
            req.body?.note
        );
        return res.status(201).json({
            success: true,
            message: "Note added successfully.",
            data: saved
        });
    } catch (error) {
        return handleError(error, res, next);
    }
}

module.exports = {
    getMyRequests,
    getRequestNotes,
    addRequestNote
};
