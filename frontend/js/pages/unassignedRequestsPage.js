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
import { renderRequestRows } from "../utils/requestRenderHelper.js"; 
import { formatDateForDisplay } from "../utils/dateHelper.js";
import { loadPage } from "../router.js";


// ============================================================
// LOAD UNASSIGNED REQUESTS
// ============================================================

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
        if (confirmation) {

            const notice = document.createElement("div");
            notice.className = "assignment-success";
            notice.setAttribute("role", "status");

            notice.textContent =
                `Request #${confirmation.requestId} was successfully assigned ` +
                `to ${confirmation.employeeName}.`;

            pipeline.prepend(notice);
        }

        // Reference the request list.
        const requestList =
            pipeline.querySelector("#unassigned-request-list");

        // Display a message if no unassigned requests exist.
        if (requests.length === 0) {
            requestList.textContent = "No unassigned requests.";
            return;
        }

        // Render request cards using the shared rendering helper.
        const requestRows = renderRequestRows(requests);

        requestList.innerHTML = requestRows;

        // Retrieve the rendered request cards.
        const workItemCards =
            requestList.querySelectorAll(".item-card");

        // Attach click events to each request card.
        workItemCards.forEach(card => {

            card.addEventListener("click", () => {

                const requestId = card.dataset.requestId;

                console.log("Selected request: ", requestId);

                // Store this page for the Back button.
                sessionStorage.setItem(
                    "requestReturnPage",
                    "unassigned-requests"
                );

                // Navigate to the assignment page.
                loadPage(
                    "assign-request",
                    requestId,
                    actingEmployeeId
                );
            });

        });

    } catch (error) {

        // Provide feedback if the API request or rendering fails.
        contentArea.textContent =
            error.message || "Unable to load unassigned requests.";

    }
}