const requestService = require("../services/requestService");

async function getRequestById(req, res, next) {
    try {
        const requestId = Number(req.params.id);

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid request ID is required."
            });
        }

        const request = await requestService.getRequestById(requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "HR request was not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: request
        });

    } catch (error) {
        next(error);
    }
}


async function updateRequestStatus(req, res, next) {
    try {
        const requestId = Number(req.params.id);
        const status = req.body.status;

        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid request ID is required."
            });
        }

        if (
            typeof status !== "string" ||
            status.trim().length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "A request status is required."
            });
        }

        const updatedRequest =
            await requestService.updateRequestStatus(
                requestId,
                status.trim()
            );

        return res.status(200).json({
            success: true,
            message: "Request status updated successfully.",
            data: updatedRequest
        });

    } catch (error) {

        if (error.code === "REQUEST_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === "INVALID_STATUS") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        next(error);
    }
}


module.exports = {
    getRequestById,
    updateRequestStatus
};