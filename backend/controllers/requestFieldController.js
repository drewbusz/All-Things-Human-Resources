const fieldService = require("../services/requestFieldService");

const errorStatuses = {
    INVALID_REQUEST_ID: 400,
    INVALID_REQUEST_TYPE: 400,
    INVALID_FIELD_VALUES: 400,
    REQUIRED_FIELD_MISSING: 400,
    REQUEST_ACCESS_DENIED: 403,
    REQUEST_NOT_FOUND: 404,
    REQUEST_TYPE_NOT_AVAILABLE: 404,
    REQUEST_COMPLETED: 409,
    REQUEST_FIELDS_LOCKED: 409
};

function handleError(error, res, next) {
    const status = errorStatuses[error.code];
    if (!status) return next(error);
    return res.status(status).json({ success: false, message: error.message });
}

async function getTypeFields(req, res, next) {
    try {
        const data = await fieldService.getTypeDefinitions(req.params.requestTypeId);
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(error, res, next);
    }
}

async function getRequestFields(req, res, next) {
    try {
        const data = await fieldService.getRequestFields(req.params.id, req.auth.employeeId);
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(error, res, next);
    }
}

async function saveRequestFields(req, res, next) {
    try {
        if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) ||
            !Object.keys(req.body).every(key => ["fieldValues", "actingEmployeeId"].includes(key))) {
            return res.status(400).json({ success: false, message: "Invalid field data." });
        }
        // Ignore the legacy actingEmployeeId field; the session determines identity.
        const data = await fieldService.saveRequestFields(
            req.params.id, req.auth.employeeId, req.body.fieldValues
        );
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(error, res, next);
    }
}

module.exports = { getTypeFields, getRequestFields, saveRequestFields };