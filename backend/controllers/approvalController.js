const approvalService = require("../services/approvalService");

const errorStatuses = {
    INVALID_REQUEST_ID: 400,
    INVALID_APPROVAL_DATA: 400,
    INVALID_APPROVAL_DECISION: 400,
    REQUEST_ACCESS_DENIED: 403,
    REQUEST_NOT_FOUND: 404,
    APPROVAL_NOT_FOUND: 404,
    APPROVAL_NOT_REQUIRED: 409,
    APPROVAL_WRONG_STEP: 409,
    APPROVAL_ALREADY_EXISTS: 409,
    APPROVAL_ALREADY_DECIDED: 409,
    APPROVAL_PENDING: 409,
    MANAGER_NOT_CONFIGURED: 409,
    MANAGER_NOT_AUTHORIZED: 409
};

function handleError(error, res, next) {
    if (!errorStatuses[error.code]) return next(error);
    return res.status(errorStatuses[error.code]).json({
        success: false,
        message: error.message
    });
}

function validBody(body, allowedFields) {
    return body && typeof body === "object" && !Array.isArray(body) &&
        Object.keys(body).every(field => allowedFields.includes(field));
}

async function prepareApproval(req, res, next) {
    try {
        const body = req.body ?? {};
        if (!validBody(body, ["summary"])) {
            return res.status(400).json({ success: false, message: "Invalid approval information." });
        }
        const data = await approvalService.prepareApproval(
            req.params.id, req.auth.employeeId, body.summary
        );
        return res.status(201).json({ success: true, data });
    } catch (error) {
        return handleError(error, res, next);
    }
}

async function getMyPendingApprovals(req, res, next) {
    try {
        const data = await approvalService.getMyPendingApprovals(req.auth.employeeId);
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(error, res, next);
    }
}

async function getRequestApproval(req, res, next) {
    try {
        const data = await approvalService.getRequestApproval(
            req.params.id, req.auth.employeeId
        );
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(error, res, next);
    }
}

async function decideApproval(req, res, next) {
    try {
        if (!validBody(req.body, ["decision"])) {
            return res.status(400).json({ success: false, message: "Invalid decision information." });
        }
        const data = await approvalService.decideApproval(
            req.params.id, req.auth.employeeId, req.body.decision
        );
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(error, res, next);
    }
}

async function reviewApproval(req, res, next) {
    try {
        if (!validBody(req.body ?? {}, [])) {
            return res.status(400).json({ success: false, message: "No extra fields are expected." });
        }
        const data = await approvalService.reviewApproval(req.params.id, req.auth.employeeId);
        return res.json({ success: true, data });
    } catch (error) {
        return handleError(error, res, next);
    }
}

module.exports = {
    prepareApproval,
    getMyPendingApprovals,
    getRequestApproval,
    decideApproval,
    reviewApproval
};