const requestRepository =
    require("../repositories/requestRepository");


async function getRequestById(
    requestId,
    employeeId
) {

    return await requestRepository.getRequestById(
        requestId,
        employeeId
    );
}


async function updateRequestStatus(
    requestId,
    employeeId,
    requestedStatus
) {

    const request =
        await requestRepository.getRequestById(
            requestId,
            employeeId
        );


    if (!request) {

        const error = new Error(
            "The HR request was not found or is not assigned to this employee."
        );

        error.code = "REQUEST_NOT_FOUND";

        throw error;
    }


    const workflowStep =
        await requestRepository.getWorkflowStepByName(
            request.request_type_id,
            requestedStatus
        );


    if (!workflowStep) {

        const error = new Error(
            "The selected status is not valid for this request."
        );

        error.code = "INVALID_STATUS";

        throw error;
    }


    const expectedNextStep =
        request.current_step_num + 1;


    if (workflowStep.step_num !== expectedNextStep) {

        const error = new Error(
            "The selected status is not the next valid workflow step."
        );

        error.code = "INVALID_STATUS";

        throw error;
    }


    const updated =
        await requestRepository.updateRequestWorkflowStep(
            requestId,
            workflowStep.workflow_step_id,
            employeeId
        );


    if (!updated) {

        const error = new Error(
            "The request could not be updated."
        );

        error.code = "UPDATE_FAILED";

        throw error;
    }


    return await requestRepository.getRequestById(
        requestId,
        employeeId
    );
}


module.exports = {
    getRequestById,
    updateRequestStatus
};