// HR Staff process request page

// import API's
import {
    getRequestById,
    getWorkflowStepsByRequestType,
    getRequestHistory,
    //getRequestFields,
    getRequestNotesByRequestId,
    //saveRequestFieldValues,
    updateRequest,
    saveRequestNote
} from "../api/requestApi.js";
import {
    loadPage
} from "../router.js"; 
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
        // update this to include request note and request field API calls once implemented on the backend 
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
        // -----------------------------------------------
        // Render Process Request Form
        //------------------------------------------------
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
        contentArea.replaceChildren(
            staticCard,
            requestForm,
            historyCard
        );


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
                        ``; 
                   // loadRequestNotes(
                   //      activityContent,
                   //      requestNotes,
                   //      requestId,
                   //      actingEmployeeId
                    //  );

                    const addNoteButton =
                        actvityContent.querySelector(
                            "#add-note-button"
                        ); 

                    addNoteButton.addEventListener(
                        "click",
                        async () => {

                            const noteText =
                                activityContent
                                    .querySelector("#new-note")
                                    .value.trim(); 

                            const noteMessage =
                                activityContent.querySelector(
                                    "#note-message"
                                ); 

                            if (!noteText) { 
                                noteMessage.textContent =
                                    "Enter a note before submitting."; 

                                return; 
                            }

                            // Prevent duplicate submissions 
                            addNoteButton.disabled = true; 

                            try { 
                                await saveRequestNote( 
                                    noteText, 
                                    requestId, 
                                    actingEmployeeId
                                ); 

                                noteMessage.textContent =
                                    "Note added successfully."; 

                                const updatedNotes =
                                    await getRequestNotesByRequestId(
                                        requestId
                                    ); 

                                loadRequestNotes(
                                    activityContent, 
                                    updatedNotes
                                ); 
                            } catch (error) { 
                                console.error(error); 

                                noteMessage.textContent =
                                    error.message ||
                                    "Unable to save note."; 
                            } finally { 
                                addNoteButton.disabled = false; 
                            }
                        });
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
                    message.classList.remove("success"); 
                }
            });
        }

        // Store the original form values for comparison.
        const originalFormData = new FormData(form);

        // Store the submit button 
        const submitButton =
            form.querySelector('[type="submit"]');

        submitButton.addEventListener("click", async event => {

            event.preventDefault();

            const message = form.querySelector(".feedback");

            // Compare original and current form values.
            const currentFormData = new FormData(form);

            const hasChanges =
                JSON.stringify([...originalFormData.entries()]) !==
                JSON.stringify([...currentFormData.entries()]);

            // Do not submit if no changes were made.
            if (!hasChanges) {

                if (message) {
                    message.textContent = "No changes were made.";
                    message.classList.remove("success", "error");
                }

                return;
            }

            // Disable the button only when an update will be submitted.
            submitButton.disabled = true;

            try {
                await submitRequestUpdates(
                    form,
                    requestId,
                    actingEmployeeId
                );

                    // Refresh request history after successful submission 
                    const updatedHistory = await getRequestHistory(
                        requestId, 
                        actingEmployeeId
                    ); 

                    // Display the refreshed history if the history tab is active 
                    const activeTab = historyCard.querySelector(
                        ".activity-tab.active"
                    ); 

                    if (activeTab?.dataset.tab === "history") { 
                        loadRequestHistory(
                            activityContent,
                            updatedHistory
                        ); 
                    }

                    // Display the message on the existing form instead of reloading
                    if (message) { 
                        message.textContent =
                            "Request updated successfully.";
                        message.classList.remove("error"); 
                        message.classList.add("success"); 
                    }

                } catch (error) {
                    console.error(error);

                    if (
                        error.message ===
                        "A request cannot move backward in its workflow."
                    ) {
                        const status =
                            form.querySelector(
                                '[name="current_step_id"]'
                            );
                            
                        if (status) { 
                            status.classList.add("invalid"); 
                            status.setAttribute(
                                "aria-invalid", 
                                "true"
                            ); 
                        }
                    }
                        
                    if (message) { 
                        message.textContent = 
                            error.message ||
                            "Unable to update request.";

                        message.classList.remove("success");
                        message.classList.add("error"); 
                    }
                } finally { 
                    if (submitButton) { 
                        submitButton.disabled = false; 
                    }
                } 
            }
        );

        // Back Button event listener
        form.querySelector("#back-button")
            .addEventListener("click", () => {

                const previousPage =
                    sessionStorage.getItem("requestReturnPage")
                    || "assigned-requests";

                console.log("Back button:", form.querySelector("#back-button"));

                console.log(
                    "Stored return page:",
                    sessionStorage.getItem("requestReturnPage")
                );
                sessionStorage.removeItem("requestReturnPage");

                loadPage(
                    previousPage,
                    actingEmployeeId
                );
            });

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



