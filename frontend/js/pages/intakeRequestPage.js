// ============================================================
// UC-2: REVIEW AND CLASSIFY INCOMING HR REQUEST
// Authorized Staff Workspace
// ============================================================
//
// Displays the selected request and allows an authorized staff
// member to assign an HR processor, set priority, and establish
// an expected completion date.
//
// Changes are saved through the existing PATCH request API.
// ============================================================

import {
    getRequestById,
    reviewIntakeRequest,
    getActiveRequestTypes, 
    getRequestHistory, 
    getRequestNotesByRequestId
} from "../api/requestApi.js";
import {
    renderRequestIntakeForm,
    loadRequestHistory,
    loadRequestNotes
} from "../utils/requestRenderHelper.js";
import { getAssignableEmployees } from "../api/employeeApi.js";
import { formatDateForDisplay } from "../utils/dateHelper.js";
import { formatFieldName } from "../utils/textFormatHelper.js";
import { loadPage } from "../router.js";


export async function loadIntakeRequestPage(
    requestId,
    actingEmployeeId
) {
    const contentArea = document.getElementById("contentArea");

    try {
        // Load the request and eligible HR employees.

        const [request, activeRequestTypes, requestHistory, requestNotes] =
            await Promise.all([
                getRequestById(requestId),
                getActiveRequestTypes(),
                getRequestHistory(requestId), 
                getRequestNotesByRequestId(requestId)
            ]);

        if (!request || typeof request !== "object") {
            throw new Error("Unable to retrieve the selected request.");
        }
        if (!Array.isArray(activeRequestTypes)) {
            throw new Error(
                "Unable to retrieve active request types."
            );
        }

        // Create the page using existing application styles.
        const staticCard = document.createElement("div");
        staticCard.classList.add("card");

        staticCard.innerHTML = `
            <h3 id="card-title">Completing Review Intake for Request # ${requestId}</h3>
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

            <div class="info-item">
                <span class="info-label">Request Summary</span>
                <span class="info-value" id="assignment-summary"></span>
            </div>
        `;

        // Dynamic Page title using return page 
        const previousPage = sessionStorage.getItem("requestReturnPage");

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

        // Render the authorized request processing form
        const requestForm =
            renderRequestIntakeForm(
                request,
                activeRequestTypes
            );

        // Render Activity Card
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
        
        // Display all 3 cards 
        contentArea.replaceChildren(
            staticCard,
            requestForm, 
            historyCard
        );

        // load Request History 
        const activityContent =
            historyCard.querySelector(
                "#activity-content"
            );

        // Display request history by default
        loadRequestHistory(
            activityContent,
            requestHistory
        );

        requestForm
            .querySelector("#assignment-confidentiality")
            .value = request.confidentiality_level ?? ""; 

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

        
        // Return to the previous page.
        requestForm.querySelector("#back-button")
            .addEventListener("click", () => {
                const previousPage =
                    sessionStorage.getItem("requestReturnPage")
                    || "pending-requests";

                sessionStorage.removeItem("requestReturnPage");

                loadPage(previousPage);
            });
        // Submit assignment values through the existing backend.
        requestForm.addEventListener("submit", async (event) => { 
            event.preventDefault(); 

        const message =
            requestForm.querySelector("#intake-message");

        // Identify which submit button was selected 
        const selectedAction = event.submitter?.id; 

        // Disable both buttons while saving changes
        const saveButtons =
            event.currentTarget.querySelectorAll(
                'button[type="submit"]'
            );

        saveButtons.forEach(button => button.disabled = true); 
        message.textContent = "Saving intake review..."; 
        message.classList.remove("success", "error"); 

        try {
            const formData = new FormData(requestForm); 

            const updateData = Object.fromEntries(
                formData.entries() 
            ); 

            // Submit intake review through the backend API 
            await reviewIntakeRequest( 
                requestId,
                updateData
            ); 

            // Create confirmation for the desination page. 
            const confirmation = {
                requestId: requestId,
                message: `Intake completed successfully for Request #${requestId}.`
            }; 

            // Navigate to the appropriate destination
            if (selectedAction === "save-assign") {

                loadPage(
                    "assign-request",
                    requestId,
                    confirmation
                );

            } else {

                loadPage(
                    "new-requests",
                    null,
                    confirmation
                );

            }

        } catch (error) {
            console.error(error);

            message.textContent =
                error.message ||
                "Unable to save request review.";

            message.classList.remove("success");
            message.classList.add("error");
        } finally {
            saveButtons.forEach(button => button.disabled = false);
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
            "Unable to load intake review page.";
    }
}