// request API for front end

// ============================================================
// UC-6: GET REQUESTS FOR AUTHENTICATED EMPLOYEE
// ============================================================

export async function getMyRequests() {
    const response = await fetch("/api/requests/mine");

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "Unable to retrieve your requests."
        );
    }

    return result.data;
}

// Get request details 
export async function getRequestById(
    requestId
) {

    // Retrieve the existing request from the Express backend
    const response = await fetch(`/api/requests/${requestId}`);

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
export async function getWorkflowStepsByRequestType(
    request_type_id
) {

    const workflowResponse = await fetch(`/api/requests/workflow-steps/${request_type_id}`);

    if (!workflowResponse.ok) {
        throw new Error("Unable to retrieve workflow steps.");
    }
    const workflowResult = await workflowResponse.json();
    return workflowResult.data;

}

// get Request History 
export async function getRequestHistory(
    request_id
) {

    const historyResponse =
        await fetch(
            `/api/requests/${request_id}/history`
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

// =======================================
// REQUEST FIELD API CALLS
// =======================================

// get request fields by requestTypeId
export async function getTypeFields(requestTypeId) {

    const response = await fetch(
        `/api/requests/types/${encodeURIComponent(requestTypeId)}/fields`
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(
            result.message ||
            "Unable to retrieve field definitions."
        );
    }

    return result.data;
}

// Get request field values 
export async function getRequestFields(requestId) {

    const response = await fetch(
        `/api/requests/${encodeURIComponent(requestId)}/fields`
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(
            result.message ||
            "Unable to retrieve saved request fields."
        );
    }

    return result.data;
}
// Get request notes with the request id 
export async function getRequestNotesByRequestId(
    request_id
) {
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

    const requestTypeResponse = await fetch(
        "/api/requests/activeRequestTypes"
    );

    const requestTypeResult = await requestTypeResponse.json();

    if (!requestTypeResponse.ok) {
        throw new Error(
            requestTypeResult.error ||
            requestTypeResult.message ||
            "Unable to retrieve active request types."
        );
    }
    return requestTypeResult.data;
}

// Work Item list APIs
export async function getAssignedRequestsByEmpId(
    employeeId
) {
    const response =
        await fetch(`/api/requests/assigned/${employeeId}`);

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
export async function getUnassignedRequests(
) {
    const response =
        await fetch(
            `/api/requests/unassigned`
        );

    const result
        = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "Unable to retrieve unassigned requests."
        );

    }

    return result.data;
}

// Get all active requests
export async function getActiveRequests() {
    const response =
        await fetch(
            `/api/requests/active`
        );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "Unable to retrieve active requests"
        );
    }
    return result.data;
}

// Get all pending requests (Pending intake review)
export async function getPendingRequests() {
    const response = await fetch(
        `/api/requests/intake`
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "Unable to review pending requests."
        );
    }
    return result.data;
}

// Get an intake request for review 
export async function getIntakeRequest(
    requestId
) {
    const response =
        await fetch(
            `api/requests/${requestId}/intake`
        );

    const result =
        await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "Unable to retrieve request for intake."
        );
    }
    return result.data;
}
// UC-5 Approvals
// -----------------------
// Get assigned approvals
export async function getMyApprovals() {
    const response = await fetch(`api/requests/approvals/mine`);

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "Unable to retrieve assigned approvals."
        );
    }
    return result.data;
}

// Get Request Approval 
export async function getRequestApproval(
    requestId
) {
    const response = await fetch(`api/requests/${requestId}/approval`);

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error ||
            result.message ||
            "Unable to retrieve approval details."
        );
    }
    return result.data;
}

// Review Approval
// Submit HR review of manager decision
export async function reviewApproval(requestId) {

    const response = await fetch(
        `/api/requests/${requestId}/approval/review`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            "Unable to complete approval review."
        );
    }

    return result.data;
}
// ===================================
// PATCH API CALLS
// ===================================

// Save Request Intake 
export async function reviewIntakeRequest(
    requestId,
    requestData
) {
    const response
        = await fetch(
            `api/requests/${requestId}/intake`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
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
            "Unable to complete request intake review."
        );
    }
    return result.data;
}
// Save updates to the request details 
export async function updateRequest(
    requestId,
    requestData,
) {
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

    return result.data;
}

// Save request notes 
export async function saveRequestNote(
    note,
    requestId
) {
    const response = await fetch(
        `/api/requests/${requestId}/notes`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ note })
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
export async function saveRequestFields(requestId, fieldValues) {

    const response = await fetch(
        `/api/requests/${encodeURIComponent(requestId)}/fields`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                fieldValues
            })
        }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(
            result.message ||
            "Unable to save request fields."
        );
    }

    return result.data;
}

// UC-5 Approvals 
export async function prepareApproval(requestId, summary) {
    const response = await fetch(`api/requests/${requestId}/approval`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                summary
            })
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error ||
            result.message ||
            "Unable to create approval request at this time."
        );
    }
    return result.data;
}

export async function decideApproval(requestId, decision) {

    const response = await fetch(`api/requests/${requestId}/approval/decision`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ decision })
    }
    );
    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error ||
            result.message ||
            "Unable to store approval decision at this time."
        );
    }
    return result.data;
}