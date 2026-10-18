const employeeRepository =
    require("../repositories/employeeRepository");


function createServiceError(
    message,
    code
) {

    const error = new Error(message);

    error.code = code;

    return error;
}


async function getEmployeesByAuthType(
    authTypeId
) {

    if (
        !Number.isInteger(authTypeId) ||
        authTypeId <= 0
    ) {

        throw createServiceError(
            "A valid authorization type ID is required.",
            "INVALID_AUTH_TYPE"
        );
    }

    return await employeeRepository
        .getEmployeesByAuthType(
            authTypeId
        );
}


async function getEmployeeByIdAndAuthType(
    employeeId,
    authTypeId
) {

    if (
        !Number.isInteger(employeeId) ||
        employeeId <= 0
    ) {

        throw createServiceError(
            "A valid employee ID is required.",
            "INVALID_EMPLOYEE"
        );
    }

    if (
        !Number.isInteger(authTypeId) ||
        authTypeId <= 0
    ) {

        throw createServiceError(
            "A valid authorization type ID is required.",
            "INVALID_AUTH_TYPE"
        );
    }

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


async function getEmployeeAuthorizations(
    employeeId,
    connection
) {

    if (
        !Number.isInteger(Number(employeeId)) ||
        Number(employeeId) <= 0
    ) {

        throw createServiceError(
            "A valid employee ID is required.",
            "INVALID_EMPLOYEE"
        );
    }

    return await employeeRepository
        .getEmployeeAuthorizations(
            Number(employeeId),
            connection
        );
}


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
            [3, 5, 6].includes(
                Number(authorization.auth_type_id)
            ) &&
            Boolean(authorization.can_view) &&
            Boolean(authorization.can_update)
    );
}


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
