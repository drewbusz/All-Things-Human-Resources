const express = require("express");

const employeeController =
    require("../controllers/employeeController");


const router = express.Router();


/*
 * Return all active HR employees eligible to receive
 * request assignments.
 *
 * Includes employees holding authorization type
 * 3, 5, or 6.
 */
router.get(
    "/eligible-assignees",
    employeeController.getEligibleHRAssignees
);


/*
 * Retrieve employees holding a specific
 * authorization type.
 *
 * Preserved for existing frontend compatibility.
 */
router.get(
    "/by-auth-type/:authTypeId",
    employeeController.getEmployeesByAuthType
);


module.exports = router;
