
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

export async function loadUnassignedRequests(
    confirmation = null
) {

    const contentArea = document.getElementById("contentArea");

    try {

        // Retrieve unassigned requests from the backend API.
        const requests = await getUnassignedRequests();

        // Create the page container and request list.
        const pipeline = document.createElement("div");

        pipeline.innerHTML = `
            <h3>Unassigned Requests</h3>
            <hr>
            <p>Select a request to assign it to an HR staff member.</p>
            <div class="request-filters">
                <div class="form-group">
                    <label for="unassigned-request-search">Search Requests</label>
                    <input type="search" id="unassigned-request-search"
                        placeholder="Search by ID, type, or employee">
                </div>
                <div class="form-group">
                    <label for="unassigned-status-filter">Filter by Status</label>
                    <select id="unassigned-status-filter">
                        <option value="all">All Statuses</option>
                    </select>
                </div>
            </div>
            <div id="unassigned-request-list"></div>
        `;

        contentArea.replaceChildren(pipeline);

        // Display confirmation after a successful assignment.
        if (confirmation) {

            const notice = document.createElement("div");
            notice.className = "action-success";
            notice.setAttribute("role", "status");

            notice.textContent = confirmation.message; 

            contentArea.prepend(notice);
        }

        // Reference the request list.
        const requestList =
            pipeline.querySelector("#unassigned-request-list");

        const searchInput = pipeline.querySelector("#unassigned-request-search");
        const statusFilter = pipeline.querySelector("#unassigned-status-filter");

        // Populate statuses from the requests already returned by the API.
        const statuses = [...new Set(requests.map(request => request.status).filter(Boolean))].sort();
        statuses.forEach(status => {
            const option = document.createElement("option");
            option.value = status;
            option.textContent = status;
            statusFilter.appendChild(option);
        });

        function renderFilteredRequests() {
            const searchTerm = searchInput.value.trim().toLowerCase();
            const selectedStatus = statusFilter.value;
            const filtered = requests.filter(request => {
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
                requestList.textContent = requests.length
                    ? "No matching requests found."
                    : "No unassigned requests.";
            }
        }

        searchInput.addEventListener("input", renderFilteredRequests);
        statusFilter.addEventListener("change", renderFilteredRequests);

        // Handle card navigation once, including after the list is filtered.
        requestList.addEventListener("click", event => {
            const card = event.target.closest(".item-card");
            if (!card) return;
            const requestId = card.dataset.requestId;

            sessionStorage.setItem("requestReturnPage", "unassigned-requests");
            loadPage("assign-request", requestId);
        });

        renderFilteredRequests();

    } catch (error) {

        // Provide feedback if the API request or rendering fails.
        contentArea.textContent =
            error.message || "Unable to load unassigned requests.";

    }
}
