// ============================================================
// Authorized Workspace: Pending Requests
// Displays requests awaiting completion of the intake process.
// ============================================================

import { getPendingRequests } from "../api/requestApi.js";
import { renderRequestRows } from "../utils/requestRenderHelper.js";
import { loadPage } from "../router.js";
import { formatDateForDisplay } from "../utils/dateHelper.js";
import { formatFieldName } from "../utils/textFormatHelper.js";


// ============================================================
// LOAD PENDING REQUESTS
// ============================================================

export async function loadPendingRequests(actingEmployeeId) {

    const contentArea =
        document.getElementById("contentArea");

    try {

        // Retrieve pending requests from the backend API.
        const requests =
            await getPendingRequests(actingEmployeeId);

        // Create the page container and request list.
        const pipeline = document.createElement("div");

        pipeline.innerHTML = `
            <h3>Pending Requests</h3>
            <hr>
            <p>
                Select a request to complete the intake process.
            </p>

            <div id="pending-request-list"></div>
        `;

        // Display the page.
        contentArea.replaceChildren(pipeline);

        // Reference the request list.
        const requestList =
            pipeline.querySelector("#pending-request-list");

        // Display a message if no pending requests exist.
        if (requests.length === 0) {

            requestList.textContent =
                "No pending requests are available.";

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
                    "pending-requests"
                );

                // Navigate to the request intake page.
                loadPage(
                    "request-intake",
                    requestId,
                    actingEmployeeId
                );

            });

        });

    } catch (error) {

        // Provide feedback if the API request or rendering fails.
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
            "Unable to load pending requests.";

    }
}