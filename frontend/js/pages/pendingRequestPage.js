
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

export async function loadPendingRequests(
    confirmation = null
) {

    const contentArea =
        document.getElementById("contentArea");

    try {

        // Retrieve pending requests from the backend API.
        const requests =
            await getPendingRequests();

        // Create the page container and request list.
        const pipeline = document.createElement("div");

        pipeline.innerHTML = `
            <h3>Pending Requests</h3>
            <hr>
            <p>
                Select a request to complete the intake process.
            </p>

            <div class="request-filters">
                <div class="form-group">
                    <label for="pending-request-search">Search Requests</label>
                    <input type="search" id="pending-request-search"
                        placeholder="Search by ID, type, or employee">
                </div>
                <div class="form-group">
                    <label for="pending-status-filter">Filter by Status</label>
                    <select id="pending-status-filter">
                        <option value="all">All Statuses</option>
                    </select>
                </div>
            </div>
            <div id="pending-request-list"></div>
        `;

        // Display the page.
        contentArea.replaceChildren(pipeline);

        // Display confirmation after a successful patch operation.
        if (confirmation) {

            const notice = document.createElement("div");
            notice.className = "action-success";
            notice.setAttribute("role", "status");

            notice.textContent =
                confirmation.message ||
                `Intake complete for Request #${confirmation.requestId}`; 

            contentArea.prepend(notice);
        }

        // Reference the request list.
        const requestList =
            pipeline.querySelector("#pending-request-list");

        const searchInput = pipeline.querySelector("#pending-request-search");
        const statusFilter = pipeline.querySelector("#pending-status-filter");

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
                    : "No pending requests are available.";
            }
        }

        searchInput.addEventListener("input", renderFilteredRequests);
        statusFilter.addEventListener("change", renderFilteredRequests);

        // Handle card navigation once, including after the list is filtered.
        requestList.addEventListener("click", event => {
            const card = event.target.closest(".item-card");
            if (!card) return;
            const requestId = card.dataset.requestId;

            sessionStorage.setItem("requestReturnPage", "new-requests");
            loadPage("request-intake", requestId);
        });

        renderFilteredRequests();

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
