// ============================================================
// Authorized Workspace: Active Requests
// ============================================================
//
// Displays all active HR requests within the authorized
// staff workspace.
//
// Authorized staff can select an existing request to review
// its information and current assignment details.
//
// ============================================================
import { getActiveRequests } from "../api/requestApi.js";
import { formatDateForDisplay } from "../utils/dateHelper.js";
import { formatFieldName } from "../utils/textFormatHelper.js";
import { loadPage } from "../router.js";

// ============================================================
// LOAD ACTIVE REQUESTS
// ============================================================

export async function loadActiveRequests(actingEmployeeId) {

    const contentArea =
        document.getElementById("contentArea");

    try {

        // Retrieve active requests from the backend API
        const requests =
            await getActiveRequests(actingEmployeeId);

        // Create the page container and request list
        const pipeline = document.createElement("div");

        pipeline.innerHTML = `
            <h3>Active Requests</h3>
            <hr>
            <p>
                Select a request to review its information
                and current assignment.
            </p>

            <div id="active-request-list"></div>
        `;

        // Display the page
        contentArea.replaceChildren(pipeline);

        const requestList =
            pipeline.querySelector("#active-request-list");

        // Display a message if no active requests exist
        if (requests.length === 0) {

            requestList.textContent =
                "No active requests are available.";

            return;
        }

        // Create a separate card for each active request
        requests.forEach(request => {

            const card = document.createElement("div");

            // Reuse existing request card styles
            card.className = "assigned-item-card";

            card.innerHTML = `
                <div class="assigned-item-content">

                    <h3 class="request-title"></h3>

                    <div class="assigned-item-details">

                        <div class="assigned-detail">
                            <span class="detail-label">
                                Submitted By
                            </span>

                            <span class="detail-value submitted-by"></span>
                        </div>

                        <div class="assigned-detail">
                            <span class="detail-label">
                                Submitted Date
                            </span>

                            <span class="detail-value submitted-date"></span>
                        </div>

                        <div class="assigned-detail">
                            <span class="detail-label">
                                Assigned To
                            </span>

                            <span class="detail-value assigned-to"></span>
                        </div>

                        <div class="assigned-detail">
                            <span class="detail-label">
                                Priority
                            </span>

                            <span class="detail-value priority"></span>
                        </div>

                        <div class="assigned-detail">
                            <span class="detail-label">
                                Status
                            </span>

                            <span class="detail-value request-status"></span>
                        </div>

                    </div>
                </div>

                <button
                    type="button"
                    class="view-request-button"
                >
                    View Request →
                </button>
            `;

            // Populate card information safely
            card.querySelector(".request-title").textContent =
                `#${request.request_id} — ${request.request_type}`;

            card.querySelector(".submitted-by").textContent =
                request.submitted_by ?? "";

            card.querySelector(".submitted-date").textContent =
                formatDateForDisplay(request.submission_date);

            card.querySelector(".assigned-to").textContent =
                request.assigned_to
                    ? formatFieldName(request.assigned_to)
                    : "Unassigned";

            card.querySelector(".priority").textContent =
                request.priority_level
                    ? formatFieldName(request.priority_level)
                    : "Not Set";

            card.querySelector(".request-status").textContent =
                request.status
                    ? formatFieldName(request.status)
                    : "";

            // Navigate to the selected request
            card.querySelector(".view-request-button")
                .addEventListener("click", () => {

                    loadPage(
                        "assign-request",
                        request.request_id,
                        actingEmployeeId
                    );

                });

            // Add completed card to the list
            requestList.appendChild(card);

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
            "Unable to load active requests.";

    }
}