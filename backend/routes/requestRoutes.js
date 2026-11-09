
const express = require("express");
const requestController = require("../controllers/requestController");
const submissionController = require("../controllers/requestSubmissionController");
const intakeController = require("../controllers/requestIntakeController");
const managementController = require("../controllers/requestManagementController");

const router = express.Router();

// UC-1: Request submission
router.get(
    "/activeRequestTypes",
    submissionController.getActiveRequestTypes
);

router.post(
    "/",
    submissionController.createRequest
);

// UC-2: Intake and classification
router.get(
    "/intake",
    intakeController.getPendingRequests
);

router.post(
    "/intake/email",
    intakeController.createEmailRequest
);

router.get(
    "/:id/intake",
    intakeController.getIntakeRequest
);

router.patch(
    "/:id/intake",
    intakeController.reviewRequest
);

// Request management
router.get(
    "/active",
    managementController.getActiveRequests
);

router.patch(
    "/:id/manage",
    managementController.manageRequest
);

// Existing request management
router.get(
    "/workflow-steps/:requestTypeId",
    requestController.getWorkflowStepsByRequestType
);

router.get(
    "/assigned/:employeeId",
    requestController.getAssignedRequestsByEmpId
);

router.get(
    "/:id/history",
    requestController.getRequestHistoryByRequestId
);

router.get(
    "/unassigned",
    requestController.getUnassignedRequests
);

router.get(
    "/:id",
    requestController.getRequestById
);

// Use the new logic for assignment and classification
router.patch(
    "/:id",
    (req, res, next) => {
        if (
            Object.prototype.hasOwnProperty.call(
                req.body ?? {},
                "request_type_id"
            )
        ) {
            return managementController.manageRequest(req, res, next);
        }

        return requestController.updateRequest(req, res, next);
    }
);

module.exports = router;
