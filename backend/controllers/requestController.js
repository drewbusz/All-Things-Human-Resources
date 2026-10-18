const requestService = require("../services/requestService");


function handleServiceError(error, res, next) {
    if (error.code === "REQUEST_NOT_FOUND") {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }

    if (error.code === "REQUEST_ACCESS_DENIED") {
        return res.status(403).json({
            success: false,
            message: error.message
        });
    }

    const badRequestErrors = [
        "INVALID_REQUEST_ID",
        "INVALID_REQUEST_TYPE",
        "INVALID_REQUEST_DATA",
        "INVALID_SUMMARY",
        "INVALID_PRIORITY",
        "INVALID_CONFIDENTIALITY",
        "INVALID_DATE",
        "INVALID_EMPLOYEE",
        "INVALID_STATUS",
        "INVALID_AUTH_TYPE",
        "EMPLOYEE_NOT_AUTHORIZED"
    ];

    if (badRequestErrors.includes(error.code)) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    if (error.code === "UPDATE_FAILED") {
        return res.status(409).json({
            success: false,
            message: error.message
        });
    }

    return next(error);
}


function getActingEmployeeId(req) {
    const value = req.method === "GET"
        ? req.query.actingEmployeeId
        : req.body?.actingEmployeeId;

    if (
        value === undefined ||
        value === null ||
        value === "" ||
        !Number.isSafeInteger(Number(value)) ||
        Number(value) <= 0
    ) {
        return null;
    }

    return Number(value);
}


async function getRequestById(req, res, next) {
    try {
        const requestId = Number(req.params.id);
        const actingEmployeeId = getActingEmployeeId(req);

        if (!Number.isSafeInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid request ID is required."
            });
        }

        if (!actingEmployeeId) {
            return res.status(400).json({
                success: false,
                message: "A valid acting employee ID is required."
            });
        }

        const request = await requestService.getRequestById(
            requestId,
            actingEmployeeId
        );

        return res.status(200).json({
            success: true,
            data: request
        });

    } catch (error) {
        return handleServiceError(error, res, next);
    }
}


async function getWorkflowStepsByRequestType(req, res, next) {
    try {
        const requestTypeId = Number(req.params.requestTypeId);

        if (!Number.isSafeInteger(requestTypeId) || requestTypeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid request type ID is required."
            });
        }

        const workflowSteps = await requestService
            .getWorkflowStepsByRequestType(requestTypeId);

        return res.status(200).json({
            success: true,
            data: workflowSteps
        });

    } catch (error) {
        return handleServiceError(error, res, next);
    }
}


async function getRequestHistoryByRequestId(req, res, next) {
    try {
        const requestId = Number(req.params.id);
        const actingEmployeeId = getActingEmployeeId(req);

        if (!Number.isSafeInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid request ID is required."
            });
        }

        if (!actingEmployeeId) {
            return res.status(400).json({
                success: false,
                message: "A valid acting employee ID is required."
            });
        }

        const history = await requestService
            .getRequestHistoryByRequestId(
                requestId,
                actingEmployeeId
            );

        return res.status(200).json({
            success: true,
            data: history
        });

    } catch (error) {
        return handleServiceError(error, res, next);
    }
}


async function getAssignedRequestsByEmpId(req, res, next) {
    try {
        const employeeId = Number(req.params.employeeId);
        const actingEmployeeId = getActingEmployeeId(req);

        if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid employee ID is required."
            });
        }

        if (!actingEmployeeId) {
            return res.status(400).json({
                success: false,
                message: "A valid acting employee ID is required."
            });
        }

        const requests = await requestService
            .getAssignedRequestsByEmpId(
                employeeId,
                actingEmployeeId
            );

        return res.status(200).json({
            success: true,
            data: requests
        });

    } catch (error) {
        return handleServiceError(error, res, next);
    }
}


async function getUnassignedRequests(req, res, next) {
    try {
        const actingEmployeeId = getActingEmployeeId(req);

        if (!actingEmployeeId) {
            return res.status(400).json({
                success: false,
                message: "A valid acting employee ID is required."
            });
        }

        const requests = await requestService
            .getUnassignedRequests(actingEmployeeId);

        return res.status(200).json({
            success: true,
            data: requests
        });

    } catch (error) {
        return handleServiceError(error, res, next);
    }
}


async function updateRequest(req, res, next) {
    try {
        const requestId = Number(req.params.id);
        const actingEmployeeId = getActingEmployeeId(req);

        if (!Number.isSafeInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid request ID is required."
            });
        }

        if (!actingEmployeeId) {
            return res.status(400).json({
                success: false,
                message: "A valid acting employee ID is required."
            });
        }

        const requestData = { ...req.body };
        delete requestData.actingEmployeeId;

        const updatedRequest = await requestService.updateRequest(
            requestId,
            actingEmployeeId,
            requestData
        );

        return res.status(200).json({
            success: true,
            message: "HR request updated successfully.",
            data: updatedRequest
        });

    } catch (error) {
        return handleServiceError(error, res, next);
    }
}


module.exports = {
    getRequestById,
    getWorkflowStepsByRequestType,
    getRequestHistoryByRequestId,
    getAssignedRequestsByEmpId,
    getUnassignedRequests,
    updateRequest
};
