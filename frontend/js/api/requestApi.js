// request API for front end

export async function getRequestById(requestId) { 

    try {
        // Retrieve the existing request from the Express backend
        const response = await fetch(`/api/requests/${requestId}`);

        if (!response.ok) {
            throw new Error("Unable to retrieve request.");

        }
        const result = await response.json();
        return result.data;
    } catch (error) { 
        return error.message; 
    }
} 

export async function getWorkflowStepsByRequestType(request_type_id) {
   
        const workflowResponse = await fetch(`/api/requests/workflow-steps/${request_type_id}`);

        if (!workflowResponse.ok) {
            throw new Error("Unable to retrieve workflow steps.");
            return null; 
        }
        const workflowResult = await workflowResponse.json(); 
        return workflowResult.data; 
    
}

export async function getRequestHistory(request_id) { 

    const historyResponse = await fetch(
        `/api/requests/${request_id}/history`
    );

    const historyResult = await historyResponse.json();


    if (!historyResponse.ok) {
        throw new Error("unable to review request history");
        console.Error(
            historyResult.message ||
            "Unable to retrieve request history. "
        ); 
    }
    console.log(
        "History API result:",
        historyResult
    ); 
    console.log(
        "History data:",
        historyResult.data
    );

    console.log(
        "Is history data an array?",
        Array.isArray(historyResult.data)
    );



    return historyResult.data; 
}

export async function updateRequest(
        requestId,
        requestTypeId,
        actingEmployeeId
) {
        const message = document.getElementById("request-message");

        // Read the form values 
        const priority = document.getElementById("request-priority").value;
        const expectedCompletion = document.getElementById("expected-completion").value;
        const currentStepId = document.getElementById("current-step-id").value;

        const requestData = {
            request_type_id: requestTypeId,
            actingEmployeeId: actingEmployeeId,
            brief_summary: document.getElementById("request-summary").value,
            priority_level: priority === "" ? null : priority,
            confidentiality_level: document.getElementById("confidentiality-level").value,
            expected_completion: expectedCompletion === "" ? null : expectedCompletion,
            current_step_id: Number(currentStepId)
        };

        // Submit one update request 
        try {
            const response = await fetch(`/api/requests/${requestId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify(requestData)
                }
            );
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || result.error || "Unable to update request.");
            }

            message.textContent = "Request updated successfully.";
        } catch (error) {
            console.error(error);

            message.textContent = error.message || "Unable to update request.";

        }
}