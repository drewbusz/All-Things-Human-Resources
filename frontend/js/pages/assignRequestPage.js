// ============================================================
// UC-3: Assign and Prioritize HR Request
// Authorized Staff Workspace
// ============================================================
//
// Displays the selected request and allows an authorized staff
// member to assign an HR processor, set priority, and establish
// an expected completion date.
//
// Changes are saved through the existing PATCH request API.
// ============================================================
// API imports 
import {
    getRequestById,
    saveRequestAssignment,
    getActiveRequestTypes, 
    getRequestHistory, 
    getRequestNotesByRequestId, 
    getTypeFields, 
    getRequestFields, 
    saveRequestFields
} from "../api/requestApi.js";

import { getAssignableEmployees } from "../api/employeeApi.js";

// Rendering Imports 
import {
    renderAuthorizedRequestProcessingForm, 
    loadRequestHistory, 
    loadRequestNotes
} from "../utils/requestRenderHelper.js"; 
import { formatDateForDisplay } from "../utils/dateHelper.js";
import { formatFieldName } from "../utils/textFormatHelper.js"; 

// Load Page
import { loadPage } from "../router.js";


export async function loadAssignRequestPage(
    requestId,
    confirmation = null
) {

    const contentArea = document.getElementById("contentArea");

    try {
        // Load the request and eligible HR employees.
       
        const [request, employees, requestNotes, requestHistory] =
            await Promise.all([
                getRequestById(requestId),
                getAssignableEmployees(),
                getRequestNotesByRequestId(requestId), 
                getRequestHistory(requestId)
            ]);

        // Retrieve field definitions, saved values
        const [typeFields, fieldValues] =
            await Promise.all([
                getTypeFields(request.request_type_id),
                getRequestFields(requestId),
            ]);

        if (!request || typeof request !== "object") {
            throw new Error("Unable to retrieve the selected request.");
        }
        if (!Array.isArray(employees)) {
            throw new Error(
                "Unable to retrieve assignable employees."
            );
        }

        // Create the page using existing application styles.
        const staticCard = document.createElement("div");
        staticCard.classList.add("card"); 
        
        staticCard.innerHTML = `
            <h3 id="card-title"></h3>
            <hr>

            <div class="card-row">
                <div class="info-item">
                    <span class="info-label">Current Request Type</span>
                    <span class="info-value" id="assignment-type"></span>
                </div>

                <div class="info-item">
                    <span class="info-label">Submitted By</span>
                    <span class="info-value" id="assignment-submitter"></span>
                </div>

                <div class="info-item">
                    <span class="info-label">Submitted Date</span>
                    <span class="info-value" id="assignment-date"></span>
                </div>
                <div class="info-item">
                    <span class="info-label">Intake Source</span>
                    <span class="info-value" id="intake-source"></span>
                </div>
            </div>

            <hr>
            <div class="card-row-assign">
            <div class="info-item">
                <span class="info-label">Current Status</span>
                <span class="info-value" id="current-step-id"></span>
            </div>
            <div class="info-item">
                <span class="info-label">Confidentiality Level</span>
                <span class="info-value" id="request-confidentiality"></span>
            </div>
            <div class="info-item">
                <span class="info-label">Request Summary</span>
                <span class="info-value" id="assignment-summary"></span>
            </div>
            </div>
        `;

        // Dynamic Page title using return page 
        const previousPage = sessionStorage.getItem("requestReturnPage"); 
        
        const cardTitle = 
            previousPage === "active-requests"
                ? "Viewing Active Request # " + requestId
                : "Assign & Priotize Request # " + requestId; 

        staticCard.querySelector("#card-title").textContent = cardTitle; 

        // Populate static request information
        staticCard.querySelector("#assignment-type").textContent =
            request.request_type ?? "";

        staticCard.querySelector("#assignment-submitter").textContent =
            request.submitted_by ?? "";

        staticCard.querySelector("#assignment-date").textContent =
            formatDateForDisplay(request.submission_date);

        staticCard.querySelector("#assignment-summary").textContent =
            request.brief_summary ?? "";

        staticCard.querySelector("#intake-source").textContent = 
            formatFieldName(request.intake_source ?? ""); 

        staticCard.querySelector("#current-step-id").textContent = formatFieldName(request.status ?? ""); 

        staticCard.querySelector('#request-confidentiality').textContent = formatFieldName(request.confidentiality_level ?? ""); 

        // Render the authorized request processing form
        const requestForm =
            renderAuthorizedRequestProcessingForm(
                request, 
                employees, 
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

        // Store original request field values for comparison
        const originalFieldValues =
            collectRequestFieldValues(requestForm);

        // Store reference to the activity content to load notes and history
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

        // Return to the previous page.
        requestForm.querySelector("#back-button")
            .addEventListener("click", () => {
                const previousPage =
                    sessionStorage.getItem("requestReturnPage")
                    || "unassigned-requests"; 

                sessionStorage.removeItem("requestReturnPage"); 

                loadPage(previousPage);
            });

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

                    const latestHistory = await getRequestHistory(
                        requestId
                    );

                    loadRequestHistory(activityContent, latestHistory);
                } else if (tab.dataset.tab === "notes") {


                    const requestNotes = await getRequestNotesByRequestId(
                        requestId
                    );

                    loadRequestNotes(activityContent, requestNotes);
                }
            } catch (error) {
                activityContent.textContent =
                    error.message || "Unable to load request activity.";
            }
        });

        // Submit assignment values through the existing backend.
        requestForm.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                const message =
                    requestForm.querySelector("#assignment-message");

                const saveButton =
                    event.currentTarget.querySelector(
                        'button[type="submit"]'
                    );

                saveButton.disabled = true;
                message.textContent = "Saving assignment...";

                const employeeSelect =
                    requestForm.querySelector("#assigned-employee");

                const updateData = {
                    assigned_emp_id: Number(employeeSelect.value),
                    confidentiality_level: requestForm.querySelector("#assignment-confidentiality").value,
                    priority_level:
                        requestForm.querySelector("#assignment-priority").value,
                    expected_completion:
                        requestForm.querySelector("#assignment-completion").value
                };
                // Collect current request field values 
                const currentFieldValues =
                    collectRequestFieldValues(requestForm); 

                // Determine whether request fields changed
                const fieldValuesChanged =
                    JSON.stringify(originalFieldValues) !==
                    JSON.stringify(currentFieldValues);

                // Track whether request fields were saved
                let requestFieldsSaved = false;

                try {
                    // Determine the destination page.
                    const previousPage =
                        sessionStorage.getItem("requestReturnPage")
                        || "unassigned-requests";

                    // Compare original values against submitted values.
                    const employeeChanged =
                        String(request.assigned_emp_id ?? "") !=
                        String(updateData.assigned_emp_id ?? "");

                    // Build confirmation message
                    let confirmationMessage;

                    if (employeeChanged) {

                        const employeeName =
                            employeeSelect.options[
                                employeeSelect.selectedIndex
                            ].text;

                        const action =
                            !request.assigned_emp_id
                                ? "assigned"
                                : "reassigned";

                        confirmationMessage =
                            `Request #${request.request_id} was successfully ${action} to ${employeeName}.`;

                    } else {

                        confirmationMessage =
                            `Request changes saved successfully for Request #${requestId}.`;
                    }

                    // Save request-specific field values if changed
                    if (fieldValuesChanged) {

                        await saveRequestFields(
                            requestId,
                            currentFieldValues
                        );

                        requestFieldsSaved = true;
                    }

                    // Save assignment information
                    await saveRequestAssignment(requestId, updateData);

                    // Build confirmation object
                    const confirmation = {
                        requestId: request.request_id,
                        message: confirmationMessage
                    };

                    // Clear stored return page
                    sessionStorage.removeItem("requestReturnPage");

                    // Navigate with confirmation
                    loadPage(
                        previousPage,
                        null,
                        confirmation
                    );

                } catch (error) {

                    console.error(error);

                    message.textContent = requestFieldsSaved
                        ? `Request fields were saved, but assignment changes failed: ${error.message}`
                        : error.message || "Unable to save assignment.";

                    message.classList.remove("success");
                    message.classList.add("error");

                } finally {
                    saveButton.disabled = false; 
                }
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
            error.message ||
            "Unable to load assignment page.";
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