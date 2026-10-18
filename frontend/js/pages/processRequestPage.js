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
    formatDateForDisplay, 
    formatDateForInput
} from "../utils/dateHelper.js";

// text format
import {
    formatFieldName
} from "../utils/textFormatHelper.js"; 

export async function loadProcessRequestPage(requestId, actingEmployeeId) {

    const contentArea = document.getElementById("contentArea");

    try {
        // Retrieve the request and requestHistory together 
        const [request, requestHistory] = await Promise.all([
            getRequestById(requestId, actingEmployeeId),
            getRequestHistory(requestId, actingEmployeeId)
        ]);

        console.log("Request retrieved: ", request);

        // Retrieve the workflow steps for the request type
        const workflowSteps =
            await getWorkflowStepsByRequestType(
                request.request_type_id
            );


        // retrieve the request history to build the history card


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
                        ${formatDateForDisplay(request.submission_date)}
                    </span>
                </div>


                <div class="info-item">
                    <span class="info-label">
                        Confidentiality Level
                    </span>

                    <span class="info-value">
                        ${formatFieldName(request.confidentiality_level)}
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
                    activityContent.textContent =
                        `Request notes pending backend implementation.`; 
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

        const form =
            document.getElementById("process-request-form");

        if (!form) { 
            throw new Error (
                "Unable to locate the process request form."
            );
        }
        // Clear Status validation when user changes it
        const status =
            form.querySelector(
                '[name="current_step_id"]'
            );

        if (status) {
            status.addEventListener("change", () => {

                status.classList.remove("invalid");
                status.removeAttribute("aria-invalid");

                const message =
                    form.querySelector(".feedback");

                if (message) {
                    message.textContent = "";
                    message.classList.remove("error");
                }
            });
        }

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                try { 
                    await submitRequestUpdates(
                        form,
                        requestId, 
                        actingEmployeeId
                    ); 

                    await loadProcessRequestPage(
                        requestId, 
                        actingEmployeeId
                    ); 
                    const message =
                        form.querySelector(".feedback"); 
                    if (message) { 
                        message.textContent =
                            "Requested updated successfully.";
                        message.classList.add("success"); 
                    }

                } catch (error) {
                    console.error(error);

                    const message =
                        form.querySelector(".feedback");

                    if (
                        error.message === "A request cannot move backward in its workflow."
                    ) {
                        const status =
                            form.querySelector(
                                '[name="current_step_id"]'
                            );

                        status.classList.add("invalid"); 
                    }
                        
                    if (message) { 
                        message.textContent = 
                            error.message ||
                            "Unable to update request.";
                        message.classList.add("error"); 
                    }
                } 
            }
        );


    } catch (error) {

        console.error(error);

        contentArea.innerHTML = `
        <div class="card">
            <p id="request-error-message"></p>
        </div>
    `;

        contentArea
            .querySelector("#request-error-message")
            .textContent =
            error.message || "Unable to load request information.";
    }
}


// ==============================
// Submit Request Updates
// ==============================

async function submitRequestUpdates(
    form,
    requestId,
    actingEmployeeId
) {

    // const fieldValues = [
    //     ...requestForm.querySelectorAll(
    //         "[data-field-id]"
    //     )
    // ].map(field => ({
    //     field_id: field.dataset.fieldId,
    //     field_val: field.value
    // }));

    // Read the form values 
    const requestData = {
        brief_summary:
            form.querySelector(
                '[name="brief_summary"]'
            )?.value,

        priority_level:
            form.querySelector(
                '[name="priority_level"]'
            )?.value,

        expected_completion:
            form.querySelector(
                '[name="expected_completion"]'
            )?.value,

        current_step_id:
            form.querySelector(
                '[name="current_step_id"]'
            )?.value,

        actingEmployeeId: actingEmployeeId
    };

    console.log(
        "Submitting request:",
        requestId,
        requestData
    );

    const updatedRequest =
        await updateRequest(
            requestId,
            requestData
        );

    // await saveRequestFieldValues(
    //     requestId,
    //      fieldValues,
    //     actingEmployeeId
    // );

    return updatedRequest;
}



