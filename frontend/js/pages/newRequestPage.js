// New Request Page - Authorized HR Staff

// Request APIs
import {
    getRequestById,
    getWorkflowStepsByRequestType,
    getRequestHistory,
    getRequestFields,
    getRequestNotesByRequestId,
    getActiveRequestTypes,
    saveRequestNote,
    saveRequestFieldValues,
    updateRequest,
} from "../api/requestApi.js";
// Employee API
import {
    getEmployeesByAuthType
} from "../api/employeeApi.js";
// import request render helper
import {
    renderAuthorizedRequestProcessingForm,
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

export async function loadNewRequestPage(requestId, actingEmployeeId) {

    const contentArea = document.getElementById("contentArea");

    try {
        // Retrieve the existing request from the Express backend
        const request = await getRequestById(requestId);

        console.log("Request retrieved: ", request);

        // Retrieve the workflow steps for the request type   
        //const workflowSteps = await getWorkflowStepsByRequestType(request.request_type_id);


        // retrieve the request history to build the history card
        const requestHistory = await getRequestHistory(requestId);

        // retrieve active request types 
        //const activeRequestTypes = await getActiveRequestTypes(); 

        // retrieve assignable employees 
        const employeeOptions = await getEmployeesByAuthType(3);


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
        const requestForm = renderAuthorizedRequestProcessingForm(
            request,
            employeeOptions
        );

        // request history card
        const historyCard = document.createElement("div");
        historyCard.classList.add("card");

        historyCard.innerHTML = `
            <div class="activity-tabs">

                <button
                    type="button"
                    class="activity-tab active"
                    data-tab="history"
                >
                    History
                </button>

                <button
                    type="button"
                    class="activity-tab"
                    data-tab="notes"
                >
                    Notes
                </button>

            </div>

            <hr>

            <h3>Request Activity</h3>

            <hr>

            <div id="activity-content">
            </div>
        `;

        // Render the cards within the content area
        //contentArea.appendChild(staticCard);
        contentArea.appendChild(requestForm);
        contentArea.appendChild(historyCard);

        const activityContent = historyCard.querySelector("#activity-content");
        loadRequestHistory(
            activityContent,
            requestHistory
        );


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
// Submit request changes to the backend 
// ===============================================================
async function submitRequestUpdates(
    requestForm,
    requestId,
    requestTypeId,
    actingEmployeeId
) {

    const fieldValues = [
        ...requestForm.querySelectorAll(
            "[data-field-id]"
        )
    ].map(field => ({
        field_id: field.dataset.fieldId,
        field_val: field.value
    }));


    await updateRequest(
        requestId,
        requestTypeId,
        actingEmployeeId
    );


    // await saveRequestFieldValues(
    //     fieldValues,
    //     requestId,
    //     actingEmployeeId
    // );
}