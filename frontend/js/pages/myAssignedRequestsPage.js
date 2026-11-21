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

// Authentication State
import {
    getCurrentEmployeeState
} from "../../auth/authState.js";  

export async function loadMyAssignedRequests() { 

    const contentArea = document.getElementById("contentArea");

    // Retrieve the authenticated employee 
    const employee =
        getCurrentEmployeeState();

    // Retrieve the employeeId
    const employeeId = employee.employeeId; 

    try { 
        const assignedRequests = await getAssignedRequestsByEmpId(employeeId);
        

        // build pipeline
        const pipeline = document.createElement("div");
        pipeline.classList.add("request-pipeline"); 
        
        pipeline.innerHTML = `
            <h3>My Assigned Requests</h3>
            <hr><br>
            <div id="request-rows"></div>
        `; 
        contentArea.replaceChildren(pipeline);

        const assignedRequestRows = await renderRequestRows(assignedRequests);

        const requestRows = pipeline.querySelector("#request-rows"); 
        requestRows.innerHTML = assignedRequestRows; 

        const workItemCards = contentArea.querySelectorAll(".item-card");

        workItemCards.forEach(card => {

            card.addEventListener("click", () => {

                const requestId = card.dataset.requestId;

                sessionStorage.setItem(
                    "requestReturnPage",
                    "assigned-requests"
                );

                loadPage(
                    "process-request",
                    requestId
                );
            });
        });

    } catch (error) { 
        contentArea.textContent =
            error.message || "Unable to load assigned requests.";
    }
}