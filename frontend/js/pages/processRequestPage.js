
﻿// HR Staff process request page

// import API's
import {
    getRequestById,
    getWorkflowStepsByRequestType,
    getRequestHistory,
    getTypeFields, 
    getRequestFields,
    getRequestNotesByRequestId,
    saveRequestFields, 
    updateRequest,
    saveRequestNote, 
    prepareApproval, 
    getRequestApproval, 
    reviewApproval
} from "../api/requestApi.js";
import {
    loadPage
} from "../router.js"; 
// import request render helper
import {
    renderProcessRequestForm,
    loadRequestHistory,
    loadRequestNotes, 
    renderApprovalRequestForm, 
    renderReviewApprovalForm
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

export async function loadProcessRequestPage(requestId, confirmation = null) {

    const contentArea = document.getElementById("contentArea");

    try {
        // Retrieve the request and requestHistory together 
        // update this to include request note and request field API calls once implemented on the backend 
        const [request, requestHistory, requestNotes] =
            await Promise.all([
                getRequestById(requestId),
                getRequestHistory(requestId),
                getRequestNotesByRequestId(requestId)
            ]);

        // Retrieve field definitions, saved values, and workflow steps
        const [typeFields, fieldValues, workflowSteps] =
            await Promise.all([
                getTypeFields(request.request_type_id),
                getRequestFields(requestId),
                getWorkflowStepsByRequestType(request.request_type_id)
            ]);

        // Determine current workflow status
        const currentStep = workflowSteps.find(
            step => step.workflow_step_id == request.current_step_id
        );

        const currentStatus = currentStep?.step_name;

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

                    <span class="info-value" id="request-type">
                    </span>
                </div>

                <div class="info-item">
                    <span class="info-label">Submitted By</span>

                    <span class="info-value" id="submitted-by"></span>
                </div>


                <div class="info-item">
                    <span class="info-label">Request Date</span>

                    <span class="info-value" id="submission-date"></span>
                </div>


                <div class="info-item">
                    <span class="info-label">Confidentiality Level</span>

                    <span class="info-value" id="confidentiality"></span>
                </div>

            </div>
        `;

        staticCard.querySelector("#request-type")
            .textContent = request.request_type; 

        staticCard.querySelector("#submitted-by")
            .textContent = formatFieldName(request.submitted_by); 

        staticCard.querySelector("#submission-date")
            .textContent = formatDateForDisplay(request.submission_date); 
        staticCard.querySelector("#confidentiality")
            .textContent = formatFieldName(request.confidentiality_level); 

        // process request card
        const requestForm =
            renderProcessRequestForm(
                request,
                workflowSteps,
                typeFields, 
                fieldValues
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

        // Display confirmation after a successful patch operation.
        if (confirmation) {

            const notice = document.createElement("div");
            notice.className = "action-success";
            notice.setAttribute("role", "status");

            notice.textContent =
                confirmation.message ||
                `Intake complete for Request #${confirmation.requestId}`;

            contentArea.prepend(notice);
        }

        confirmation = ''; 

        // =====================================
        // APPROVAL NOTIFICATION
        // =====================================

        const approvalRequired = Boolean(request.approval_required);

        if (approvalRequired) {

            const approvalNotification =
                document.createElement("div");

            approvalNotification.classList.add("approval-needed");

            const formActions =
                requestForm.querySelector("#form-actions");

            // --------------------------------
            // APPROVAL STATUS
            // --------------------------------

            switch (currentStatus?.trim().toLowerCase()) {
                case "review approval":
                    approvalNotification.textContent =
                        "Manager decision received. HR review is required.";

                    const reviewApprovalButton =
                        document.createElement("button");

                    reviewApprovalButton.type = "button";
                    reviewApprovalButton.classList.add("review-approval-button");
                    reviewApprovalButton.textContent =
                        "Review Manager Decision";

                    formActions?.appendChild(reviewApprovalButton);

                    reviewApprovalButton.addEventListener("click", async () => {

                        reviewApprovalButton.disabled = true;

                        try {

                            // Retrieve manager approval information
                            const approval =
                                await getRequestApproval(requestId);

                            // Render HR review form
                            const reviewForm =
                                renderReviewApprovalForm(
                                    requestId,
                                    approval
                                );

                            // Handle confirmation submission
                            handleReviewApprovalSubmission(
                                reviewForm,
                                requestId
                            );

                            // Return to the processing form if Back is selected
                            reviewForm.querySelector("#back-button")
                                .addEventListener("click", () => {
                                    reviewForm.replaceWith(requestForm);
                                });

                            // Replace processing form with review form
                            requestForm.replaceWith(reviewForm);

                        } catch (error) {

                            console.error(error);

                            approvalNotification.textContent =
                                error.message ||
                                "Unable to retrieve manager approval information.";

                        } finally {

                            reviewApprovalButton.disabled = false;
                        }
                    });

                    break;
                case "manager approval":
                    approvalNotification.textContent =
                        "Management approval requested and pending for this item.";
                    break;
                case "hr processing":
                    approvalNotification.textContent =
                        "Management approval required for this request.";

                    const managerName = request.manager_name; 

                    const prepareApprovalButton =
                        document.createElement("button");

                    prepareApprovalButton.type = "button";
                    prepareApprovalButton.classList.add("prepare-approval-button");
                    prepareApprovalButton.textContent = "Prepare Approval Request";

                    formActions?.appendChild(prepareApprovalButton);

                    prepareApprovalButton.addEventListener("click", () => {

                        const approvalForm =
                            renderApprovalRequestForm(requestId, managerName);

                        handleApprovalSubmission(approvalForm, requestId);

                        requestForm.replaceWith(approvalForm);
                    });
                    break;
                default:
                    console.log(
                        "No approval action configured for status:",
                        currentStatus
                    );
                    break;
            }

            // Display approval notification
            contentArea.prepend(approvalNotification);
        }
        // ==============================
        // Activity Tab Event Listeners
        // ==============================

        historyCard.addEventListener("click", async event => {
            const addNoteButton = event.target.closest("#add-note-button");

            if (addNoteButton) {
                const noteText = activityContent.querySelector("#new-note")?.value.trim();
                const noteMessage = activityContent.querySelector("#note-message");

                if (!noteText) {
                    noteMessage.textContent = "Enter a note before submitting.";
                    return;
                }

                addNoteButton.disabled = true;

                try {
                    await saveRequestNote(noteText, requestId);

                    const updatedNotes = await getRequestNotesByRequestId(
                        requestId
                    );

                    loadRequestNotes(activityContent, updatedNotes);

                    activityContent.querySelector("#note-message").textContent =
                        "Note added successfully.";
                } catch (error) {
                    const message = activityContent.querySelector("#note-message");

                    if (message) {
                        message.textContent =
                            error.message || "Unable to save note.";
                    }
                } finally {
                    addNoteButton.disabled = false;
                }

                return;
            }

            const tab = event.target.closest(".activity-tab");
            if (!tab) return;

            historyCard.querySelectorAll(".activity-tab").forEach(button => {
                button.classList.remove("active");
            });

            tab.classList.add("active");

            try {
                if (tab.dataset.tab === "history") {
                    
                    const latestHistory =
                        await getRequestHistory(requestId);

                    loadRequestHistory(activityContent, latestHistory);
                } else if (tab.dataset.tab === "notes") {


                    const requestNotes =
                        await getRequestNotesByRequestId(requestId);

                    loadRequestNotes(activityContent, requestNotes);
                }
            } catch (error) {
                activityContent.textContent =
                    error.message || "Unable to load request activity.";
            }
        });


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
        const originalFormData = [...new FormData(form).entries()]; 

        // Store original request specific field values 
        const originalFieldValues = collectRequestFieldValues(form); 

        // Store the submit button 
        const submitButton =
            form.querySelector("#save-changes-button");


        submitButton.addEventListener("click", async event => {

            event.preventDefault();

            const message = form.querySelector(".feedback");

            // Collect current form values 
            const currentFormData = [...new FormData(form).entries()]; 

            // Colelct current field values 
            const currentFieldValues = collectRequestFieldValues(form); 

            // Check if values changes
            const requestDataChanged =
                JSON.stringify(originalFormData) !==
                JSON.stringify(currentFormData); 

            const fieldValuesChanged = 
                JSON.stringify(originalFieldValues) !== 
                JSON.stringify(currentFieldValues); 

            const hasChanges = 
                requestDataChanged || fieldValuesChanged; 

            

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
                    fieldValuesChanged, 
                    requestDataChanged
                );

                    // Refresh request history after successful submission 
                    const updatedHistory = await getRequestHistory(
                        requestId, 
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

                loadPage(previousPage);
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
// ============================================================
// COLLECT REQUEST FIELD VALUES
// ============================================================

function collectRequestFieldValues(form) {

    return [
        ...form.querySelectorAll("[data-field-id]")
    ].map(field => ({
        field_id: field.dataset.fieldId,
        field_val: field.value
    }));

}

// ==============================
// Submit Request Updates
// ==============================

async function submitRequestUpdates(
    form,
    requestId, 
    fieldValuesChanged, 
    requestDataChanged
) {

    // If the request field values changed
    if (fieldValuesChanged) { 
        // Collect the new field values
        const fieldValues =
            collectRequestFieldValues(form); 

        // Pass the updated fields to the backend 
        await saveRequestFields(requestId, fieldValues); 
    }


    if (requestDataChanged) { 
        // Read the form values 
        const requestData = {
            brief_summary:
                form.querySelector('[name="brief_summary"]')?.value,

            priority_level:
                form.querySelector('[name="priority_level"]')?.value,

            expected_completion:
                form.querySelector('[name="expected_completion"]')?.value,

            current_step_id:
                form.querySelector('[name="current_step_id"]')?.value
        };

        

        console.log(
            "Submitting request:",
            requestId,
            requestData
        );

        return await updateRequest(requestId, requestData);
    }


    return null;
}

// ============================================================
// SUBMIT APPROVAL REQUEST
// ============================================================

function handleApprovalSubmission(form, requestId) {

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const summary =
            form.elements.summary.value.trim();

        const message =
            form.querySelector(".feedback");

        const submitButton =
            form.querySelector('[type="submit"]');

        if (!summary) {

            message.textContent =
                "An approval summary is required.";

            message.classList.add("error");

            return;
        }

        submitButton.disabled = true;
        console.log("Preparing approval request for: ", requestId); 
        console.log("Approval Summary: ", summary); 

        try {

            // Submit approval request to backend
            await prepareApproval(requestId, summary);

            const confirmation = {
                requestId,
                message: `Approval request prepared successfully for request ID: ${requestId}.`
            };

            loadPage(
                "process-request",
                requestId,
                confirmation
            ); 

        } catch (error) {

            console.error("Approval submission failed:", error);

            message.textContent =
                error.message ||
                "Unable to prepare approval request.";

            message.classList.remove("success");
            message.classList.add("error");

        } finally {

            submitButton.disabled = false;
        }
    });
}

// ============================================================
// SUBMIT HR APPROVAL REVIEW
// ============================================================

function handleReviewApprovalSubmission(form, requestId) {

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const message =
            form.querySelector(".feedback");

        const submitButton =
            form.querySelector("#confirm-approval-review");

        submitButton.disabled = true;

        message.textContent = "Submitting approval review...";
        message.classList.remove("success", "error");

        try {

            // Submit HR review to backend
            await reviewApproval(requestId);

            // Prepare confirmation
            const confirmation = {
                requestId: requestId,
                message:
                    `Manager's decision reviewed successfully for Request #${requestId}.`
            };

            // Reload processing page with updated workflow status
            loadPage(
                "process-request",
                requestId,
                confirmation
            );

        } catch (error) {

            console.error("Approval review failed:", error);

            message.textContent =
                error.message ||
                "Unable to complete approval review.";

            message.classList.remove("success");
            message.classList.add("error");

        } finally {

            submitButton.disabled = false;
        }
    });
}