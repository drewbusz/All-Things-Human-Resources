const express = require("express");
const requestController = require("../controllers/requestController");
const submissionController = require("../controllers/requestSubmissionController");
const intakeController = require("../controllers/requestIntakeController");
const managementController = require("../controllers/requestManagementController");
const trackingController = require("../controllers/requestTrackingController");
const approvalController = require("../controllers/approvalController");
const fieldController = require("../controllers/requestFieldController");

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

// Request-specific field definitions and saved values
router.get("/types/:requestTypeId/fields", fieldController.getTypeFields);
router.get("/:id/fields", fieldController.getRequestFields);
router.post("/:id/fields", fieldController.saveRequestFields);

// UC-6: Employee request tracking and notes
router.get("/mine", trackingController.getMyRequests);
router.get("/:id/notes", trackingController.getRequestNotes);
router.post("/:id/notes", trackingController.addRequestNote);

// UC-5: HR prepares approvals; managers decide; HR reviews the outcome.
router.get("/approvals/mine", approvalController.getMyPendingApprovals);
router.post("/:id/approval", approvalController.prepareApproval);
router.get("/:id/approval", approvalController.getRequestApproval);
router.post("/:id/approval/decision", approvalController.decideApproval);
router.post("/:id/approval/review", approvalController.reviewApproval);

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

// Route assignment and classification changes through management
router.patch("/:id", (req, res, next) => {
    const managementFields = [
        "request_type_id",
        "assigned_emp_id",
        "confidentiality_level",
        "authorized_employee_ids"
    ];

    const isManagementUpdate = managementFields.some(field =>
        Object.prototype.hasOwnProperty.call(req.body ?? {}, field)
    );

    if (isManagementUpdate) {
        return managementController.manageRequest(req, res, next);
    }

    return requestController.updateRequest(req, res, next);
});

module.exports = router;