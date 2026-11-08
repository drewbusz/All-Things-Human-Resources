
const express = require("express");
const requestController = require("../controllers/requestController");
const submissionController = require("../controllers/requestSubmissionController");
const intakeController = require("../controllers/requestIntakeController");

const router = express.Router();

// UC-1: Submit requests
router.get(
    "/activeRequestTypes",
    submissionController.getActiveRequestTypes
);

router.post(
    "/",
    submissionController.createRequest
);

// UC-2: Review and classify incoming requests
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

router.patch(
    "/:id",
    requestController.updateRequest
);

module.exports = router;
