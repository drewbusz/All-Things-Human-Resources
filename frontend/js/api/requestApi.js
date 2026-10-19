// request API for front end

// Get request details 
export async function getRequestById(
    requestId,
    actingEmployeeId
) { 

    // Retrieve the existing request from the Express backend
    const response = await fetch(`/api/requests/${requestId}?actingEmployeeId=${actingEmployeeId}`);

    const result = await response.json();


    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "Unable to retrieve request.");
    }

    return result.data; 
} 

// Get workflow steps by request type 
export async function getWorkflowStepsByRequestType(request_type_id) {
   
        const workflowResponse = await fetch(`/api/requests/workflow-steps/${request_type_id}`);

        if (!workflowResponse.ok) {
            throw new Error("Unable to retrieve workflow steps.");
        }
        const workflowResult = await workflowResponse.json(); 
        return workflowResult.data; 
    
}

// get Request History 
export async function getRequestHistory(request_id, actingEmployeeId) { 

    const historyResponse =
        await fetch(
        `/api/requests/${request_id}/history?actingEmployeeId=${actingEmployeeId}`
    );

    const historyResult =
        await historyResponse.json();


    if (!historyResponse.ok) {
        throw new Error(
            historyResult.message || 
            historyResult.error || 
            "Unable to review request history"
        );
    }

    return historyResult.data; 
}

// get request fields and values 
export async function getRequestFields(request_id) { 
    const requestFieldResponse = await fetch(`/api/requests/${request_id}/fields`);
    const requestFieldResult = await requestFieldResponse.json(); 

    if (!requestFieldResponse.ok) { 
        throw new Error(
            requestFieldResult.message ||
            requestFieldResult.error || 
            "Unable to retrieve request fields."
        ); 
    }

    return requestFieldResult.data; 
    
}

// Get request notes with the request id 
export async function getRequestNotesByRequestId(request_id) { 
    const requestNoteResponse = await fetch(`/api/requests/${request_id}/notes`); 
    const requestNoteResult = await requestNoteResponse.json(); 

    if (!requestNoteResponse.ok) { 
        throw new Error(
            requestNoteResult.message || 
            requestNoteResult.error || 
            "Unable to retrieve request notes."); 
    }

    return requestNoteResult.data; 
}

// Get all active request types 
export async function getActiveRequestTypes() {
    const requestTypeResponse = await fetch("/api/requests/activeRequestTypes");
    const requestTypeResult = await requestTypeResponse.json();

    if (!requestTypeResponse.ok) {
        throw new Error(
            requestTypeResult.message || "Unable to retrieve request types"
        );
    }

    return requestTypeResult.data;
}

// Work Item list APIs
export async function getAssignedRequestsByEmpId(employeeId, actingEmployeeId) { 
    const response =
        await fetch(`/api/requests/assigned/${employeeId}?actingEmployeeId=${actingEmployeeId}`); 

    const result = await response.json(); 

    if (!response.ok) { 
        throw new Error(
            result.message ||
            result.error || 
            "Unable to retrieve assigned requests."); 
    }

    return result.data; 
}

// Get unassigned requests
export async function getUnassignedRequests(actingEmployeeId) {
    const response =
        await fetch(
            `/api/requests/unassigned?actingEmployeeId=${actingEmployeeId}`
        );

    const result
        = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error || 
            "Unable to retrieve unassigned requests."
        );

        error.code = result.code; 
        throw error;
    }

    return result.data;
}

// Save updates to the request details 
export async function updateRequest(
    requestId,
    requestData,
) {
    console.log("requestId:", requestId);
    console.log("requestData:", requestData);
    // Submit one update request
    const response
        = await fetch(
            `/api/requests/${requestId}`,
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
        throw new Error(
            result.message ||
            result.error || 
            "Unable to update request."
        );
    }
    return result.data; 
}

// UC-3: Save assignment and prioritization changes.
export async function saveRequestAssignment(
    requestId,
    requestData
) {
    const response
        = await fetch(
            `/api/requests/${requestId}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(
            result.message ||
            result.error ||
            "Unable to save assignment."
        );
    }

    return result;
}

// Save request notes (Pending backend)
export async function saveRequestNote(note) { 
    const response = await fetch(
        `/api/requests/${note.request_id}/notes`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(note)
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "Unable to save request note."
        );
    }

    return result.data;
        
}

// Save request field values (Pending backend)
export async function saveRequestFieldValues(
    fieldValues,
    requestId,
    actingEmployeeId
) { 
    const response = await fetch(
        `/api/requests/${requestId}/fields`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fieldValues,
                actingEmployeeId
            })
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "Unable to save request field values."
        );
    }

    return result.data;
}

