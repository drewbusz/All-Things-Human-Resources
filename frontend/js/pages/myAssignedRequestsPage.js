// My Assigned Requests
// Request API used
import {
    getAssignedRequestsByEmpId
} from "../api/requestApi.js"; 

// Render Helper
import {
    renderRequestRows
} from "../utils/requestRenderHelper.js"; 
import {
    loadPage
} from "../router.js"; 

export async function loadMyAssignedRequests(employeeId, actingEmployeeId) { 

    const contentArea = document.getElementById("contentArea"); 

    try { 
        const assignedRequests = await getAssignedRequestsByEmpId(employeeId, actingEmployeeId);
        const assignedRequestRows = await renderRequestRows(assignedRequests);

        // build pipeline
        const pipeline = document.createElement("div");

        pipeline.innerHTML = ` 
            <h3>My Assigned Requests</h3>
            <hr><br>
            ${assignedRequestRows}
        `;

        contentArea.appendChild(pipeline);

        const workItemCards = contentArea.querySelectorAll(".assigned-item-card");

        workItemCards.forEach(card => {
            card.addEventListener("click", () => {
                const requestId = card.dataset.requestId;

                console.log("Selected request: ", requestId);

                // clear the content area 
                // contentArea.innerHTML = ``;

                loadPage(
                    "process-request",
                    requestId,
                    actingEmployeeId
                );
            });
        }); 

    } catch (error) { 
        contentArea.textContent =
            error.message || "Unable to load assigned requests.";
    }
}