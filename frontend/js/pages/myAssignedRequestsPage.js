
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
            <div class="request-filters">
                <div class="form-group">
                    <label for="assigned-request-search">Search Requests</label>
                    <input type="search" id="assigned-request-search"
                        placeholder="Search by ID, type, or employee">
                </div>
                <div class="form-group">
                    <label for="assigned-status-filter">Filter by Status</label>
                    <select id="assigned-status-filter">
                        <option value="all">All Statuses</option>
                    </select>
                </div>
            </div>
            <div id="request-rows"></div>
        `; 
        contentArea.replaceChildren(pipeline);

        const requestList = pipeline.querySelector("#request-rows");
        const searchInput = pipeline.querySelector("#assigned-request-search");
        const statusFilter = pipeline.querySelector("#assigned-status-filter");

        // Populate statuses from the requests already returned by the API.
        const statuses = [...new Set(assignedRequests.map(request => request.status).filter(Boolean))].sort();
        statuses.forEach(status => {
            const option = document.createElement("option");
            option.value = status;
            option.textContent = status;
            statusFilter.appendChild(option);
        });

        function renderFilteredRequests() {
            const searchTerm = searchInput.value.trim().toLowerCase();
            const selectedStatus = statusFilter.value;
            const filtered = assignedRequests.filter(request => {
                const searchableText = [
                    request.request_id,
                    request.request_type,
                    request.brief_summary,
                    request.submitted_by,
                    request.assigned_to
                ].join(" ").toLowerCase();

                return searchableText.includes(searchTerm) &&
                    (selectedStatus === "all" || request.status === selectedStatus);
            });

            requestList.innerHTML = filtered.length ? renderRequestRows(filtered) : "";
            if (!filtered.length) {
                requestList.textContent = assignedRequests.length
                    ? "No matching requests found."
                    : "No assigned requests are available.";
            }
        }

        searchInput.addEventListener("input", renderFilteredRequests);
        statusFilter.addEventListener("change", renderFilteredRequests);

        // Handle card navigation once, including after the list is filtered.
        requestList.addEventListener("click", event => {
            const card = event.target.closest(".item-card");
            if (!card) return;
            const requestId = card.dataset.requestId;

            sessionStorage.setItem("requestReturnPage", "assigned-requests");
            loadPage("process-request", requestId);
        });

        renderFilteredRequests();

    } catch (error) { 
        contentArea.textContent =
            error.message || "Unable to load assigned requests.";
    }
}
