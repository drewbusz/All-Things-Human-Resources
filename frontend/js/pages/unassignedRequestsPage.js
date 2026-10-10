// Unassigned request pipeline view | Authorized Staff

// My Assigned Requests
// Request API used
import {
    getUnassignedRequests
} from "../api/requestApi.js";

// Render Helper
import {
    renderRequestRows
} from "../utils/requestRenderHelper.js";
import {
    loadPage
} from "../router.js";

export async function loadUnassignedRequests() {

    const unassignedRequests = await getUnassignedRequests();
    const requestRows = await renderRequestRows(unassignedRequests);

    // build pipeline
    const contentArea = document.getElementById("contentArea");
    const pipeline = document.createElement("div");

    pipeline.innerHTML = ` 
        <h3>All Unassigned Requests</h3>
        <hr><br>
        ${requestRows}
    `;

    contentArea.appendChild(pipeline);

    const workItemCards = contentArea.querySelectorAll(".assigned-item-card");

    workItemCards.forEach(card => {
        card.addEventListener("click", () => {
            const requestId = card.dataset.requestId;

            console.log("Selected request: ", requestId);

            // clear the content area 
            contentArea.innerHTML = ``;

            loadPage(
                "new-request",
                requestId,
                actingEmployeeId
            );
        });
    });
}