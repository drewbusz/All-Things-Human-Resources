const employeeService =
    require("../services/employeeService");


function handleServiceError(
    error,
    res,
    next
) {

    const badRequestErrors = [
        "INVALID_AUTH_TYPE",
        "INVALID_EMPLOYEE"
    ];


    if (
        badRequestErrors.includes(
            error.code
        )
    ) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }


    if (
        error.code ===
        "EMPLOYEE_NOT_AUTHORIZED"
    ) {

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }


    next(error);
}


async function getEmployeesByAuthType(
    req,
    res,
    next
) {

    try {

        const authTypeId =
            Number(
                req.params.authTypeId
            );


        const employees =
            await employeeService
                .getEmployeesByAuthType(
                    authTypeId
                );


        return res.status(200).json({
            success: true,
            data: employees
        });

    } catch (error) {

        return handleServiceError(
            error,
            res,
            next
        );
    }
}


module.exports = {
    getEmployeesByAuthType
};