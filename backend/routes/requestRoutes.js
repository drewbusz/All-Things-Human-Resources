const express = require("express");

const requestController =
    require("../controllers/requestController");


const router = express.Router();


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
    "/:id",
    requestController.getRequestById
);


router.patch(
    "/:id",
    requestController.updateRequest
);


module.exports = router;