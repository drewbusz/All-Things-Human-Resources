// ============================================================
// UC-3: Unassigned Requests
// Authorized HR Staff Workspace
// ============================================================
//
// Displays requests that have not yet been assigned to HR staff.
// Authorized staff can select a request to begin the assignment
// and prioritization process.
//
// This page displays request information only.
// Assignment changes are handled on the Assign Request page.
// ============================================================

import { getUnassignedRequests } from "../api/requestApi.js";
import { formatDateForDisplay } from "../utils/dateHelper.js";
import { loadPage } from "../router.js";


// ============================================================
// LOAD UNASSIGNED REQUESTS
// ============================================================

export async function loadUnassignedRequests(actingEmployeeId, confirmation = null) {

    const contentArea = document.getElementById("contentArea");

    try {

        // Retrieve unassigned requests from the backend API.
        const requests = await getUnassignedRequests(actingEmployeeId);


        // Create the page container and request list.
        const pipeline = document.createElement("div");

        pipeline.innerHTML = `
            <h3>Unassigned Requests</h3>
            <hr>
            <p>Select a request to assign it to an HR staff member.</p>
            <div id="unassigned-request-list"></div>
        `;

        contentArea.appendChild(pipeline);

        // Display confirmation after a successful assignment.
        // This remains visible when the user returns to the queue.
        if (confirmation) {
            const notice = document.createElement("div");
            notice.className = "assignment-success";
            notice.setAttribute("role", "status");

            notice.textContent =
                `Request #${confirmation.requestId} was successfully assigned ` +
                `to ${confirmation.employeeName}.`;

            pipeline.prepend(notice);
        }

        const requestList =
            pipeline.querySelector("#unassigned-request-list");


        // Display a message if no unassigned requests exist.
        if (requests.length === 0) {
            requestList.textContent = "No unassigned requests.";
            return;
        }


        // Create a separate card for each unassigned request.
        requests.forEach(request => {

            const card = document.createElement("div");

            // Reuse existing request card styles for consistency.
            card.className =
                "assigned-item-card unassigned-item-card";


            // Display only the information needed to identify
            // the request. Priority and assignment controls belong
            // to the next screen in UC-3.
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

                    </div>
                </div>

                <button
                    type="button"
                    class="assign-request-button"
                >
                    Assign Request →
                </button>
            `;


            // Populate the card with values returned by the API.
            // textContent avoids interpreting database values as HTML.
            card.querySelector(".request-title").textContent =
                `#${request.request_id} — ${request.request_type}`;

            card.querySelector(".submitted-by").textContent =
                request.submitted_by;

            card.querySelector(".submitted-date").textContent =
                formatDateForDisplay(request.submission_date);


            // Only the button initiates navigation.
            // Pass the selected request ID to the assignment page.
            card.querySelector(".assign-request-button")
                .addEventListener("click", () => {

                    loadPage(
                        "assign-request",
                        request.request_id, 
                        actingEmployeeId
                    );

                });


            // Add the completed request card to the list.
            requestList.appendChild(card);

        });

    } catch (error) {

        // Provide feedback if the API request or rendering fails.
        contentArea.textContent =
            error.message || "Unable to load unassigned requests.";

    }
}