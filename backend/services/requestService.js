const requestRepository =
    require("../repositories/requestRepository");

const employeeService =
    require("./employeeService");


/*
 * Seed data:
 * auth_type_id 3 = modification
 *
 * Employees handling HR requests
 * need this authorization.
 */
const MODIFICATION_AUTH_TYPE_ID = 3;


function createServiceError(
    message,
    code
) {

    const error = new Error(message);

    error.code = code;

    return error;
}


function isValidDate(dateValue) {

    if (
        typeof dateValue !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
        return false;
    }


    const [year, month, day] =
        dateValue.split("-").map(Number);


    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );


    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}


async function getRequestById(
    requestId
) {

    const request =
        await requestRepository.getRequestById(
            requestId
        );


    if (!request) {

        throw createServiceError(
            "The HR request was not found.",
            "REQUEST_NOT_FOUND"
        );
    }


    return request;
}


async function getWorkflowStepsByRequestType(
    requestTypeId
) {

    return await requestRepository
        .getWorkflowStepsByRequestType(
            requestTypeId
        );
}


async function getRequestHistoryByRequestId(
    requestId
) {

    /*
     * Make sure the request exists first.
     */
    await getRequestById(
        requestId
    );


    return await requestRepository
        .getRequestHistoryByRequestId(
            requestId
        );
}


async function getAssignedRequestsByEmpId(
    employeeId
) {

    return await requestRepository
        .getAssignedRequestsByEmpId(
            employeeId
        );
}


async function updateRequest(
    requestId,
    actingEmployeeId,
    requestData
) {

    const currentRequest =
        await getRequestById(
            requestId
        );

        /*
     * Make sure the employee making the change
     * is authorized to modify HR requests.
     */
    await employeeService
        .getEmployeeByIdAndAuthType(
            actingEmployeeId,
            MODIFICATION_AUTH_TYPE_ID
        );

    /*
     * Request type can't be changed here.
     * If it's sent, make sure it still matches.
     */
    if (
        requestData.request_type_id !== undefined &&
        Number(requestData.request_type_id) !==
            Number(currentRequest.request_type_id)
    ) {

        throw createServiceError(
            "The request type does not match this HR request.",
            "INVALID_REQUEST_TYPE"
        );
    }


    /*
     * Summary
     */
    if (
        requestData.brief_summary !== undefined
    ) {

        if (
            typeof requestData.brief_summary !==
                "string" ||
            requestData.brief_summary.trim() === ""
        ) {

            throw createServiceError(
                "A request summary is required.",
                "INVALID_SUMMARY"
            );
        }


        requestData.brief_summary =
            requestData.brief_summary.trim();
    }


    /*
     * Priority
     */
    if (
        requestData.priority_level === ""
    ) {
        requestData.priority_level = null;
    }


    if (
        requestData.priority_level !== undefined
    ) {

        const validPriorities = [
            null,
            "low",
            "medium",
            "high"
        ];


        if (
            !validPriorities.includes(
                requestData.priority_level
            )
        ){

            throw createServiceError(
                "Priority must be low, medium, high, or blank.",
                "INVALID_PRIORITY"
            );
        }
    }


    /*
     * Confidentiality
     */
    if (
        requestData.confidentiality_level !==
        undefined
    ) {

        const validConfidentialityLevels = [
            "Nonconfidential",
            "Confidential",
            "Highly Confidential"
        ];


        if (
            !validConfidentialityLevels.includes(
                requestData.confidentiality_level
            )
        ) {

            throw createServiceError(
                "The selected confidentiality level is invalid.",
                "INVALID_CONFIDENTIALITY"
            );
        }
    }


    /*
     * Expected completion
     */
    if (
        requestData.expected_completion === ""
    ) {
        requestData.expected_completion = null;
    }


    if (
        requestData.expected_completion !==
            undefined &&
        requestData.expected_completion !==
            null
    ) {

        if (
            !isValidDate(
                requestData.expected_completion
            )
        ) {

            throw createServiceError(
                "Expected completion must be a valid date in YYYY-MM-DD format.",
                "INVALID_DATE"
            );
        }
    }


    /*
     * Assigned employee
     */
    if (
        requestData.assigned_emp_id !==
            undefined &&
        requestData.assigned_emp_id !==
            null
    ) {

        const assignedEmployeeId =
            Number(
                requestData.assigned_emp_id
            );


        if (
            !Number.isInteger(
                assignedEmployeeId
            ) ||
            assignedEmployeeId <= 0
        ) {

            throw createServiceError(
                "The assigned employee ID is invalid.",
                "INVALID_EMPLOYEE"
            );
        }


        /*
         * Make sure they're allowed to handle HR requests.
         */
        await employeeService
            .getEmployeeByIdAndAuthType(
                assignedEmployeeId,
                MODIFICATION_AUTH_TYPE_ID
            );


        requestData.assigned_emp_id =
            assignedEmployeeId;
    }


    /*
     * Workflow status
     */
    if (
        requestData.current_step_id !== undefined
    ) {

        const requestedStepId =
            Number(
                requestData.current_step_id
            );


        if (
            !Number.isInteger(
                requestedStepId
            ) ||
            requestedStepId <= 0
        ) {

            throw createServiceError(
                "The selected workflow status is invalid.",
                "INVALID_STATUS"
            );
        }


        const workflowSteps =
            await requestRepository
                .getWorkflowStepsByRequestType(
                    currentRequest.request_type_id
                );


        const requestedStep =
            workflowSteps.find(
                step =>
                    Number(
                        step.workflow_step_id
                    ) === requestedStepId
            );


        if (!requestedStep) {

            throw createServiceError(
                "The selected status does not belong to this request workflow.",
                "INVALID_STATUS"
            );
        }


        const currentStepNum =
            Number(
                currentRequest.current_step_num
            );


        /*
         * Same step or one step forward is fine.
         * No going backward or skipping steps.
         */
        if (
            requestedStep.step_num <
            currentStepNum
        ) {

            throw createServiceError(
                "A request cannot move backward in its workflow.",
                "INVALID_STATUS"
            );
        }


        if (
            requestedStep.step_num >
            currentStepNum + 1
        ) {

            throw createServiceError(
                "A request cannot skip workflow steps.",
                "INVALID_STATUS"
            );
        }


        requestData.current_step_id =
            requestedStepId;
    }


    /*
     * Only send fields this screen can edit.
     */
    const updateData = {};


    const editableFields = [
        "assigned_emp_id",
        "current_step_id",
        "priority_level",
        "expected_completion",
        "brief_summary",
        "confidentiality_level"
    ];


    for (const field of editableFields) {

        if (
            Object.prototype.hasOwnProperty.call(
                requestData,
                field
            )
        ) {

            updateData[field] =
                requestData[field];
        }
    }


    const updated =
        await requestRepository.updateRequest(
            requestId,
            actingEmployeeId,
            updateData
        );


    if (!updated) {

        throw createServiceError(
            "The HR request could not be updated.",
            "UPDATE_FAILED"
        );
    }


    /*
     * Return the saved request with current values.
     */
    return await getRequestById(
        requestId
    );
}


module.exports = {
    getRequestById,
    getWorkflowStepsByRequestType,
    getRequestHistoryByRequestId,
    getAssignedRequestsByEmpId,
    updateRequest
};
