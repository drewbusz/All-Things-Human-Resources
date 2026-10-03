// HR Staff process request page

import {
    formatDateForInput,
    formatDateForDisplay
} from "../utils/dateHelpers.js";

export async function loadProcessRequestPage(requestId) { 

    const contentArea = document.getElementById("contentArea");
    
    try {
        // Retrieve the existing request from the Express backend
        const response = await fetch(`/api/requests/${requestId}`);

        if (!response.ok) {
            throw new Error("Unable to retrieve request.");
        }

        const request = await response.json();

        // Retrieve the workflow steps for the request type 
        const workflowResponse = await fetch(`/api/requests/workflow-steps/${request.request_type_id}`); 

        if (!workflowResponse.ok) { 
            throw new Error("Unable to retrieve workflow steps.");
        }

        const workflowSteps = await workflowResponse.json(); 
        const statusOptions = workflowSteps.map(step => {
            const selected = Number(step.workflow_step.id) === Number(request.current_step_id) ? "selected" : "";
            return `<option value="${step.workflow_step_id}" ${selected}>${step.step_name}</option>`;
        }).join(""); 

        // ----------------------------------------------------
        // Render Process Request Form
        // ----------------------------------------------------
        contentArea.innerHTML = `
            <section>
                <h2>Process HR Request</h2>

                <form id="process-request-form">
                    <h3>Request Information</h3>

                    <!-- Request ID -->
                    <div>
                        <label for="request-id">Request ID:</label>
                        <input type="text" id="request-id" value="${request.request_id}" readonly>
                    </div>

                    <!-- Request Type -->
                    <div>
                        <label for="request-type">Request Type:</label>
                        <input type="text" id="request-type" value="${request.request_type}" readonly>
                    </div>

                    <!-- Submission Date -->
                    <div>
                        <label for="submission-date">Submission Date:</label>
                        <input type="text" id="submission-date" value="${formatDateForDisplay(request.submission_date)}" readonly>
                    </div>
                    
                    <!-- Summary -->
                    <div>
                        <label for="request-summary">Summary:</label>
                        <textarea id="request-summary" name="brief_summary" required>${request.brief_summary ?? ""}</textarea>
                    </div>

                    <!-- Priority -->
                    <div>
                        <label for="request-priority">Priority Level:</label>
                        <select id="request-priority" name="priority_level">
                            <option value="" ${request.priority_level ? "selected" : ""}></option>
                            <option value="low" ${request.priority_level === "low" ? "selected" : ""}>Low</option>
                            <option value="medium" ${request.priority_level === "medium" ? "selected" : ""}>Medium</option>
                            <option value="high" ${request.priority_level === "high" ? "selected" : ""}>High</option>
                        </select>
                    </div>

                    <!-- Confidentiality -->
                    <div>
                        <label for="confidentiality-level">Confidentiality:</label>
                        <select id="confidentiality-level" name="confidentiality-level">
                            <option value="" ${request.confidentiality_level ? "selected" : ""}></option>
                            <option value="Nonconfidential" ${request.confidentiality_level === "Nonconfidential" ? "selected" : ""}>Nonconfidential</option>
                            <option value="Confidential" ${request.confidentiality_level === "Confidential" ? "selected" : ""}>Confidential</option>
                            <option value="Highly Confidential" ${request.confidentiality_level === "Highly Confidential" ? "selected" : ""}>Highly Confidential</option>
                        </select>
                    </div>

                    <!-- Expected Completion -->
                    <div>
                        <label for="expected-completion">
                            Expected Completion:
                        </label>

                        <input
                            type="date"
                            id="expected-completion"
                            name="expected_completion"
                            value="${formatDateForInput(request.expected_completion)}"
                        >
                    </div>

                    <!-- Status -->
                    <div>
                        <label for="current-status">Current Status:</label>
                        <select
                            id="current-step-id"
                            name="current-status"
                            required
                        >
                            ${statusOptions}
                        </select>
                    </div>

                    <!-- Submit button -->
                    <button type="submit">Save Changes</button>

                    <p id="request-message"></p>

                </form>
            </section>
        `;

        // ==============================
        // Single form submission
        // ==============================
        const form = document.getElementById("process-request-form"); 
        form.addEventListener("submi", async (event) => { 
            event.preventDefault(); 

            await saveRequestChanges(
                requestId,
                request.request_type_id
            ); 
        })


    } catch (error) { 
        console.error(error); 
        contentArea.innerHTML = ` 
            <p>Unable to retrieve request.</p>
        `;
    }
}

// ==============================
// Save request changes
// ==============================
async function saveRequestChanges(
    requestId, 
    requestTypeId
) { 
    const message = document.getElementById("request-message"); 

    // Read the form values 
    const priority = document.getElementById("request-priority").value; 
    const expectedCompletion = document.getElementById("expected-completion").value; 
    const currentStepId = document.getElementById("current-step-id").value; 

    const requestData = {
        request_type_id: requestTypeId;
        brief_summary: documernt.getElementById("request-summary").value,
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
            throw new Error(result.error || "Unable to update request."); 
        }

        message.textContent = "Request updated successfully."; 
    } catch (error) { 
        console.error(error); 

        message.textContent = error.message || "Unable to update request."; 

}

   