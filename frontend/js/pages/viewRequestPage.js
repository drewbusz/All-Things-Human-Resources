
/* ============================================================
   EMPLOYEE WORKSPACE: REQUEST DETAILS
   ============================================================

   UC-6: View submitted request information and activity.
   Request information is read-only for employees.

   ============================================================ */

import {
    getRequestById,
    getRequestHistory,
    getRequestNotesByRequestId,
    saveRequestNote
} from "../api/requestApi.js";

import {
    loadRequestHistory,
    loadRequestNotes
} from "../utils/requestRenderHelper.js";

import { formatDateForDisplay } from "../utils/dateHelper.js";
import { formatFieldName } from "../utils/textFormatHelper.js";
import { loadPage } from "../router.js";

// ============================================================
// CREATE REQUEST INFORMATION FIELD
// ============================================================

function createInfoField(labelText, fieldValue) {
    const field = document.createElement("div");
    field.classList.add("info-item");

    const label = document.createElement("span");
    label.classList.add("info-label");
    label.textContent = labelText;

    const value = document.createElement("span");
    value.classList.add("info-value");
    value.textContent =
        fieldValue === null ||
            fieldValue === undefined ||
            fieldValue === ""
            ? "Not Available"
            : String(fieldValue);

    field.append(label, value);

    return field;
}

// ============================================================
// LOAD EMPLOYEE REQUEST DETAILS
// ============================================================

export async function loadViewRequestPage(requestId) {
    const contentArea =
        document.getElementById("contentArea");

    const page = document.createElement("div");

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.classList.add("back-button", "employee-back-button");
    backButton.textContent = "← Back to Requests";

    backButton.addEventListener("click", () => {
        const returnPage =
            sessionStorage.getItem("requestReturnPage");

        loadPage(
            returnPage === "employee-history"
                ? "employee-history"
                : "my-requests"
        );
    });

    const loadingMessage = document.createElement("p");
    loadingMessage.textContent = "Loading request details...";

    page.append(backButton, loadingMessage);
    contentArea.replaceChildren(page);

    try {
        // Retrieve request details and activity.
        const [request, requestHistory, requestNotes] =
            await Promise.all([
                getRequestById(requestId),
                getRequestHistory(requestId),
                getRequestNotesByRequestId(requestId)
            ]);

        const informationCard = document.createElement("div");
        informationCard.classList.add("card");

        informationCard.innerHTML = `
            <h3>Request Information</h3>
            <hr>
            <div class="card-row"></div>
        `;

        const informationFields =
            informationCard.querySelector(".card-row");

        informationFields.append(
            createInfoField("Request ID", request.request_id),
            createInfoField(
                "Request Type",
                request.request_type
            ),
            createInfoField(
                "Submitted Date",
                request.submission_date
                    ? formatDateForDisplay(request.submission_date)
                    : null
            ),
            createInfoField(
                "Confidentiality Level",
                formatFieldName(request.confidentiality_level)
            )
        );

        // ----------------------------------------------------
        // Read-only request details
        // ----------------------------------------------------

        const detailsCard = document.createElement("div");
        detailsCard.classList.add("card");

        detailsCard.innerHTML = `
            <h3>Request Details</h3>
            <hr>
            <div class="card-row"></div>
        `;

        const detailFields =
            detailsCard.querySelector(".card-row");

        detailFields.append(
            createInfoField(
                "Current Status",
                request.status
            ),
            createInfoField(
                "Expected Completion",
                request.expected_completion
                    ? formatDateForDisplay(request.expected_completion)
                    : null
            ),
            createInfoField(
                "Request Summary",
                request.brief_summary
            )
        );

        // ----------------------------------------------------
        // Request activity tabs
        // ----------------------------------------------------

        const activityCard = document.createElement("div");
        activityCard.classList.add("card");

        activityCard.innerHTML = `
            <h3>Request Activity</h3>
            <hr>

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

            <div id="employee-activity-content"></div>
        `;

        const activityContent =
            activityCard.querySelector(
                "#employee-activity-content"
            );

        // Display history by default.
        loadRequestHistory(
            activityContent,
            requestHistory
        );


        // ==========================================
        // EMPLOYEE REQUEST ACTIVITY
        // ==========================================

        const allowNewNotes =
            request.status_code !== "complete";

        activityCard.addEventListener("click", async event => {

            // ------------------------------------------
            // Submit a new employee note
            // ------------------------------------------
            const addNoteButton =
                event.target.closest("#add-note-button");

            if (addNoteButton && allowNewNotes) {
                const noteInput =
                    activityContent.querySelector("#new-note");

                const noteMessage =
                    activityContent.querySelector("#note-message");

                const noteText = noteInput?.value.trim();

                // Validate before submitting.
                if (!noteText) {
                    noteMessage.textContent =
                        "Enter a note before submitting.";
                    noteMessage.setAttribute("role", "alert");
                    return;
                }

                addNoteButton.disabled = true;
                addNoteButton.textContent = "Adding Note...";
                noteMessage.textContent = "";

                try {
                    await saveRequestNote(noteText, requestId);

                    // Retrieve the latest notes after saving.
                    const updatedNotes =
                        await getRequestNotesByRequestId(requestId);

                    loadRequestNotes(
                        activityContent,
                        updatedNotes,
                        allowNewNotes
                    );

                    const confirmation =
                        activityContent.querySelector("#note-message");

                    confirmation.textContent =
                        "Note added successfully.";

                    confirmation.setAttribute("role", "status");

                } catch (error) {
                    noteMessage.textContent =
                        error.message || "Unable to add note.";

                    noteMessage.setAttribute("role", "alert");

                    addNoteButton.disabled = false;
                    addNoteButton.textContent = "Add Note";
                }

                return;
            }

            // ------------------------------------------
            // Switch between History and Notes
            // ------------------------------------------
            const selectedTab =
                event.target.closest(".activity-tab");

            if (!selectedTab) return;

            activityCard
                .querySelectorAll(".activity-tab")
                .forEach(tab => {
                    tab.classList.remove("active");
                });

            selectedTab.classList.add("active");

            try {
                if (selectedTab.dataset.tab === "history") {
                    const latestHistory =
                        await getRequestHistory(requestId);

                    loadRequestHistory(
                        activityContent,
                        latestHistory
                    );
                }

                if (selectedTab.dataset.tab === "notes") {
                    const latestNotes =
                        await getRequestNotesByRequestId(requestId);

                    loadRequestNotes(
                        activityContent,
                        latestNotes,
                        allowNewNotes
                    );
                }
            } catch (error) {
                activityContent.textContent =
                    error.message ||
                    "Unable to load request activity.";
            }
        });


        // Display the completed request page.
        loadingMessage.remove();

        page.append(
            informationCard,
            detailsCard,
            activityCard
        );

    } catch (error) {
        console.error(
            "Unable to load employee request details:",
            error
        );

        loadingMessage.textContent =
            error.message ||
            "Unable to load request details.";
    }
}
