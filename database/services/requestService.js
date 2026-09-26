const requestRepository =
    require("../repositories/requestRepository");


async function getRequestById(requestId) {

    return await requestRepository.getRequestById(requestId);
}


async function updateRequestStatus(
    requestId,
    requestedStatus
) {

    const request =
        await requestRepository.getRequestById(requestId);

    if (!request) {

        const error =
            new Error("HR request was not found.");

        error.code = "REQUEST_NOT_FOUND";

        throw error;
    }

    const workflowStep =
        await requestRepository.getWorkflowStepByName(
            request.request_type_id,
            requestedStatus
        );

    if (!workflowStep) {

        const error =
            new Error(
                "The selected status is not valid for this request."
            );

        error.code = "INVALID_STATUS";

        throw error;
    }

    await requestRepository.updateRequestWorkflowStep(
        requestId,
        workflowStep.workflow_step_id
    );

    return await requestRepository.getRequestById(
        requestId
    );
}


module.exports = {
    getRequestById,
    updateRequestStatus
};