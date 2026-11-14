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
import { renderRequestRows } from "../utils/requestRenderHelper.js"; 
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

        // Retrieve active requests from the backend API.
        const requests =
            await getActiveRequests(actingEmployeeId);

        // Create the page container and request list.
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

        // Display the page.
        contentArea.replaceChildren(pipeline);

        // Reference the request list.
        const requestList =
            pipeline.querySelector("#active-request-list");

        // Display a message if no active requests exist.
        if (requests.length === 0) {

            requestList.textContent =
                "No active requests are available.";

            return;
        }

        // Render request cards using the shared rendering helper.
        const requestRows =
            renderRequestRows(requests);

        requestList.innerHTML = requestRows;

        // Retrieve the rendered request cards.
        const workItemCards =
            requestList.querySelectorAll(".item-card");

        // Attach click events to each request card.
        workItemCards.forEach(card => {

            card.addEventListener("click", () => {

                const requestId =
                    card.dataset.requestId;

                console.log("Selected request: ", requestId);

                // Store this page for the Back button.
                sessionStorage.setItem(
                    "requestReturnPage",
                    "active-requests"
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