// My Assigned Requests
// Request API used
import {
    getAssignedRequestsByEmpId
} from "../api/requestApi.js"; 

// Render Helper
import {
    renderAssignedRequestRows
} from "../utils/requestRenderHelper.js"; 
import {
    loadProcessRequestPage
} from "../pages/processRequestPage.js"; 

export async function loadMyAssignedRequests(actingEmployeeId) { 

    const assignedRequests = await getAssignedRequestsByEmpId(actingEmployeeId); 
    const assignedRequestRows = await renderAssignedRequestRows(assignedRequests); 

    // build pipeline
    const contentArea = document.getElementById("contentArea"); 
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
            contentArea.innerHTML = ``;

            loadProcessRequestPage(
                requestId,
                actingEmployeeId
            ); 
        });
    }); 
}