
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

export async function loadActiveRequests(
    confirmation = null
) {

    const contentArea =
        document.getElementById("contentArea");

    try {

        // Retrieve active requests from the backend API.
        const requests =
            await getActiveRequests();

        // Create the page container and request list.
        const pipeline = document.createElement("div");

        pipeline.innerHTML = `
            <h3>Active Requests</h3>
            <hr>
            <p>
                Select a request to review its information
                and current assignment.
            </p>

            <div class="request-filters">
                <div class="form-group">
                    <label for="active-request-search">Search Requests</label>
                    <input type="search" id="active-request-search"
                        placeholder="Search by ID, type, or employee">
                </div>
                <div class="form-group">
                    <label for="active-status-filter">Filter by Status</label>
                    <select id="active-status-filter">
                        <option value="all">All Statuses</option>
                    </select>
                </div>
            </div>
            <div id="active-request-list"></div>
        `;

        // Display the page.
        contentArea.replaceChildren(pipeline);

        // Display confirmation after successful reassignment 
        if (confirmation) { 
            const notice = document.createElement("div"); 
            notice.className = "action-success"; 
            notice.setAttribute("role", "status"); 

            notice.textContent = confirmation.message; 

            contentArea.prepend(notice); 
        }

        // Reference the request list.
        const requestList =
            pipeline.querySelector("#active-request-list");

        const searchInput = pipeline.querySelector("#active-request-search");
        const statusFilter = pipeline.querySelector("#active-status-filter");

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
                    : "No active requests are available.";
            }
        }

        searchInput.addEventListener("input", renderFilteredRequests);
        statusFilter.addEventListener("change", renderFilteredRequests);

        // Handle card navigation once, including after the list is filtered.
        requestList.addEventListener("click", event => {
            const card = event.target.closest(".item-card");
            if (!card) return;
            const requestId = card.dataset.requestId;

            sessionStorage.setItem("requestReturnPage", "active-requests");
            loadPage("assign-request", requestId);
        });

        renderFilteredRequests();

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
