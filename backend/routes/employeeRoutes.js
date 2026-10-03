const express = require("express");

const employeeController =
    require("../controllers/employeeController");


const router = express.Router();


router.get(
    "/by-auth-type/:authTypeId",
    employeeController.getEmployeesByAuthType
);


module.exports = router;