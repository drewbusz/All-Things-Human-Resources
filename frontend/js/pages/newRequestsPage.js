// New Request Page - Authorized HR Staff

// Request APIs
import {
    getRequestById,
    getWorkflowStepsByRequestType,
    getRequestHistory,
    getRequestFields,
    getActiveRequestTypes,
    getRequestNotesByRequestId,
    saveRequestNote,
    saveRequestFieldValues,
    updateRequest,
} from "../api/requestApi.js";
// import request render helper
import {
    renderProcessRequestForm,
    loadRequestHistory,
    loadRequestNotes
} from "../utils/requestRenderHelper.js";

// date formatting helpers
import {
    formatDateForInput,
    formatDateForDisplay
} from "../utils/dateHelper.js";

// text formatting helper
import {
    formatFieldName
} from "../utils/textFormatHelper.js";

export async function loadNewRequestsPage(requestId, actingEmployeeId) {

    const contentArea = document.getElementById("contentArea");

    try {
        // Retrieve the existing request from the Express backend
        const request = await getRequestById(requestId); 

        console.log("Request retrieved: ", request);

        // Retrieve the workflow steps for the request type   
        const workflowSteps = await getWorkflowStepsByRequestType(request.request_type_id);


        // retrieve the request history to build the history card
        const requestHistory = await getRequestHistory(requestId);

        
        // retrieve active request types 
        const activeRequestTypes = await getActiveRequestTypes(); 


        // ==============================
        // PENDING BACKEND IMPLEMENTATION
        // ==============================
        // ===============================================
        // Request Type Options for select menu
        // ================================================
        // typeOptions = activeRequestTypes.map(type => {
        //    const selected =
        //           Number(type.request_type_id) ===
        //              Number(request.request_type_id)
        //              ? "selected"
        //              : "";
        //
        //      return `
        //          <option value="${type.request_type_id}"
        //          ${selected}
        //      >
        //          ${type.request_type_id}
        //      </option>`;
        //
        //}).join("");

        // ===================================
        // retrieve request fields and values
        // ===================================
        // const requestFields =
        //     await getRequestFields(requestId);

        // const requestFields = await getRequestFields(requestId);


        // retrieve request notes
        // ===========================
        // const requestNotes =
        //     await getRequestNotesByRequestId(requestId);

        // const requestNotes = await getRequestNotesByRequestId(requestId);


        // ----------------------------------------------------
        // Render Process Request Form
        // ----------------------------------------------------

        // Static details card
        const staticCard = document.createElement("div");
        staticCard.classList.add("card");

        staticCard.innerHTML = `
            
            
        `;

        // process request card
        const requestForm = document.createElement("form");
        requestForm.id = "process-request-form";

        requestForm.innerHTML = `

        <div class="card">
        <h3>New Request Information</h3>
        <hr>
        <div class="card-row">    
            <div class="info-item">
                <span class="info-label">Submitted By</span>
                <span class="info-value">${request.submitted_by}</span>
            </div>
        <div class="info-item">
            <span class="info-label">Request Date</span>
            <span class="info-value">${formatDateForDisplay(request.submission_date)}</span>
        </div>
        </div>
        
        <hr>
        <div class="process-form-layout">
        
        <div class="form-column">
            
            <div class="form-field">
                <div class="info-item">
                    <span class="info-label">Current Owner</span>
                    <span class="info-value">${request.assigned_to}</span>
                </div>
            </div>
            <div class="form-field">
                    <label for="current-status">
                        Current Status
                    </label>

                    <select id="current-step-id" name="current-status" required>
                        ${statusOptions}
                    </select>
                </div>
            <div class="form-field">
                <label for="expected-completion">Expected Completion</label>

                <input
                    type="date"
                    id="expected-completion"
                    name="expected_completion"
                    value="${formatDateForInput(request.expected_completion)}"
                >
                </div>
                
            <div class="form-field">
                <label for="request-priority">Priority Level</label>
                <select id="request-priority" name="priority_level">
                    <option value="" ${!request.priority_level ? "selected" : ""}></option>
                    <option value="low" ${request.priority_level === "low" ? "selected" : ""}>Low</option>
                    <option value="medium" ${request.priority_level === "medium" ? "selected" : ""}>Medium</option>
                    <option value="high" ${request.priority_level === "high" ? "selected" : ""}>High</option>
                </select>
            </div>
            <div class="form-field">
                <label for="confidentiality-level">Confidentiality:</label>
                <select id="confidentiality-level" name="confidentiality-level">
                    <option value="" ${!request.confidentiality_level ? "selected" : ""}></option>
                    <option value="Nonconfidential" ${request.confidentiality_level === "Nonconfidential" ? "selected" : ""}>Nonconfidential</option>
                    <option value="Confidential" ${request.confidentiality_level === "Confidential" ? "selected" : ""}>Confidential</option>
                    <option value="Highly Confidential" ${request.confidentiality_level === "Highly Confidential" ? "selected" : ""}>Highly Confidential</option>
                </select>
            </div>
        </div> <!-- col end -->
        
                
        <div class="form-column">
            <div class="info-item">
                <span class="info-label">Request Type</span>
                <span class="info-value">${request.request_type}</span>
            </div>
            
            <div class="form-field summary-field">
               <label for="request-summary">Summary</label>
               <textarea id="request-summary" name="brief_summary">${request.brief_summary ?? ""}</textarea>
            </div>
        </div>   <!-- col end -->        

        </div>
        <hr>
        
        <button type="submit">Save Changes</button>
        <p id="request-message"></p>    
        
            
        </div>
        `;

        // request history card
        const historyCard = document.createElement("div");
        historyCard.classList.add("card");

        historyCard.innerHTML = `
            <h3>Request History</h3>
            <hr>

            <div class="history-header">
                <span>Date</span>
                <span>Changed By</span>
                <span>Field</span>
                <span>Change</span>
            </div>

            <div class="history-list">
                ${historyRows ||
            `
                    <p class="history-empty">
                        No Request history is available.
                    </p>
                    `
            }
            </div>
        `;

        // Render the cards within the content area
        //contentArea.appendChild(staticCard);
        contentArea.appendChild(requestForm);
        contentArea.appendChild(historyCard);



        // ==============================
        // Single form submission
        // ==============================
        const form = document.getElementById("process-request-form");
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            await saveRequestChanges(
                requestId,
                request.request_type_id,
                actingEmployeeId
            );
        })


    } catch (error) {
        console.error(error);
        contentArea.innerHTML = ` 
            <p>Unable to retrieve request.</p>
        `;
    }
}

// ===============================================================
// THIS NEEDS TO BE UPDATED TO USE THE API CALL IN requestApi.js
// ===============================================================
async function saveRequestChanges(
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