const employeeRepository =
    require("../repositories/employeeRepository");


/*
 * Authorization types defined in seed.sql:
 *
 * 3 = HR request modification
 * 5 = Full access
 * 6 = Modification of assigned requests
 *
 * These types make an employee eligible to process
 * HR requests. Request-specific authorization and
 * confidentiality restrictions are enforced
 * separately by the request service.
 */
const HR_PROCESSOR_AUTH_TYPES = [3, 5, 6];


function createServiceError(
    message,
    code
) {

    const error = new Error(message);

    error.code = code;

    return error;
}


function validateEmployeeId(
    employeeId
) {

    if (
        !Number.isSafeInteger(employeeId) ||
        employeeId <= 0
    ) {

        throw createServiceError(
            "A valid employee ID is required.",
            "INVALID_EMPLOYEE"
        );
    }
}


function validateAuthTypeId(
    authTypeId
) {

    if (
        !Number.isSafeInteger(authTypeId) ||
        authTypeId <= 0
    ) {

        throw createServiceError(
            "A valid authorization type ID is required.",
            "INVALID_AUTH_TYPE"
        );
    }
}


async function getEmployeesByAuthType(
    authTypeId
) {

    validateAuthTypeId(authTypeId);

    return await employeeRepository
        .getEmployeesByAuthType(
            authTypeId
        );
}


async function getEmployeeByIdAndAuthType(
    employeeId,
    authTypeId
) {

    validateEmployeeId(employeeId);

    validateAuthTypeId(authTypeId);


    const employee =
        await employeeRepository
            .getEmployeeByIdAndAuthType(
                employeeId,
                authTypeId
            );


    if (!employee) {

        throw createServiceError(
            "The selected employee does not have the required authorization.",
            "EMPLOYEE_NOT_AUTHORIZED"
        );
    }


    return employee;
}


/*
 * Retrieve all currently active authorizations
 * held by the specified employee.
 *
 * An optional connection permits the request
 * repository's transaction connection to be reused.
 */
async function getEmployeeAuthorizations(
    employeeId,
    connection
) {

    validateEmployeeId(employeeId);


    const authorizations =
        await employeeRepository
            .getEmployeeAuthorizations(
                employeeId,
                connection
            );


    return authorizations;
}


/*
 * Return whether the employee has permission
 * to process HR requests in general.
 *
 * This does not authorize access to an arbitrary
 * request. Type 6 employees may only modify
 * requests assigned to them, and confidentiality
 * restrictions must still be enforced.
 */
async function isEligibleHRAssignee(
    employeeId,
    connection
) {

    const authorizations =
        await getEmployeeAuthorizations(
            employeeId,
            connection
        );


    return authorizations.some(
        authorization =>

            HR_PROCESSOR_AUTH_TYPES.includes(
                Number(authorization.auth_type_id)
            ) &&

            Boolean(authorization.can_view) &&

            Boolean(authorization.can_update)
    );
}


/*
 * Retrieve all active employees who are eligible
 * to receive HR request assignments.
 *
 * Qualifying employees may hold authorization
 * type 3, 5, or 6.
 */
async function getEligibleHRAssignees() {

    return await employeeRepository
        .getEligibleHRAssignees();
}


module.exports = {
    getEmployeesByAuthType,
    getEmployeeByIdAndAuthType,
    getEmployeeAuthorizations,
    isEligibleHRAssignee,
    getEligibleHRAssignees
};
