// HR Staff process request page

// import API's
import {
    getRequestById,
    getWorkflowStepsByRequestType,
    getRequestHistory,
    getRequestFields,
    getRequestNotesByRequestId,
    saveRequestFieldValues,
    updateRequest,
} from "../api/requestApi.js";

// import request render helper
import {
    renderProcessRequestForm,
    loadRequestHistory,
    loadRequestNotes
} from "../utils/requestRenderHelper.js";

// import date formatting helpers
import {
    formatDateForDisplay
} from "../utils/dateHelper.js";


export async function loadProcessRequestPage(requestId, actingEmployeeId) {

    const contentArea = document.getElementById("contentArea");

    try {

        const request = await getRequestById(requestId);

        console.log("Request retrieved: ", request);

        // Retrieve the workflow steps for the request type
        const workflowSteps = await getWorkflowStepsByRequestType(request.request_type_id);


        // retrieve the request history to build the history card
        const requestHistory = await getRequestHistory(requestId);


        // ==============================
        // PENDING BACKEND IMPLEMENTATION
        // ==============================

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
        const staticCard =
            document.createElement("div");

        staticCard.classList.add("card");

        staticCard.innerHTML = `
            <h3>Request Information</h3>
            <hr>

            <div class="card-row">

                <div class="info-item">
                    <span class="info-label">
                        Request Type
                    </span>

                    <span class="info-value">
                        ${request.request_type}
                    </span>
                </div>


                <div class="info-item">
                    <span class="info-label">
                        Submitted By
                    </span>

                    <span class="info-value">
                        ${request.submitted_by}
                    </span>
                </div>


                <div class="info-item">
                    <span class="info-label">
                        Request Date
                    </span>

                    <span class="info-value">
                        ${formatDateForDisplay(
            request.submission_date
        )}
                    </span>
                </div>


                <div class="info-item">
                    <span class="info-label">
                        Current Owner
                    </span>

                    <span class="info-value">
                        ${request.assigned_to}
                    </span>
                </div>

            </div>
        `;


        // process request card
        const requestForm =
            renderProcessRequestForm(
                request,
                workflowSteps,
                // requestFields
            );


        // request activity card
        const historyCard =
            document.createElement("div");

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
        contentArea.appendChild(staticCard);
        contentArea.appendChild(requestForm);
        contentArea.appendChild(historyCard);


        const activityContent =
            historyCard.querySelector(
                "#activity-content"
            );


        // Display request history by default
        loadRequestHistory(
            activityContent,
            requestHistory
        );


        // ==============================
        // Activity Tabs
        // ==============================

        historyCard.addEventListener(
            "click",
            event => {

                const tab =
                    event.target.closest(
                        ".activity-tab"
                    );

                if (!tab) {
                    return;
                }


                // Update the active tab
                historyCard
                    .querySelectorAll(
                        ".activity-tab"
                    )
                    .forEach(tabButton => {

                        tabButton.classList.remove(
                            "active"
                        );
                    });


                tab.classList.add("active");


                // Display the selected content
                if (
                    tab.dataset.tab ===
                    "history"
                ) {

                    loadRequestHistory(
                        activityContent,
                        requestHistory
                    );

                } else if (
                    tab.dataset.tab ===
                    "notes"
                ) {
                    activityContent.innerHTML = `Request notes pending backend implementation.`; 
                   // loadRequestNotes(
                   //      activityContent,
                   //      requestNotes,
                   //      requestId,
                   //      actingEmployeeId
                   //  );
                }
            }
        );


        // ==============================
        // Single form submission
        // ==============================

        const form = document.getElementById("process-request-form");


        form.addEventListener("submit", async event => {

                event.preventDefault();

                await submitRequestUpdates(
                    requestForm,
                    requestId,
                    request.request_type_id,
                    actingEmployeeId
                );
            }
        );


    } catch (error) {

        console.error(error);

        contentArea.innerHTML = `
            <p>
                Unable to retrieve request.
            </p>
        `;
    }
}


// ==============================
// Submit Request Updates
// ==============================

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