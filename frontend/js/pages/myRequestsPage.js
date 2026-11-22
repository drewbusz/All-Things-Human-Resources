
/* ============================================================
   EMPLOYEE WORKSPACE: MY REQUESTS
   ============================================================

   UC-6: Track Request Status and History

   Displays requests submitted by the authenticated employee.
   Active and completed requests are separated into sections.

   ============================================================ */

import { getMyRequests } from "../api/requestApi.js";
import { formatDateForDisplay } from "../utils/dateHelper.js";
import { loadPage } from "../router.js";

// ============================================================
// CREATE EMPLOYEE REQUEST CARD
// ============================================================

function createEmployeeRequestCard(request) {
    const card = document.createElement("div");
    card.classList.add("item-card");

    const requestId = request.request_id;

    const content = document.createElement("div");
    content.classList.add("assigned-item-content");

    const heading = document.createElement("h3");
    heading.textContent =
        `#${requestId} - ${request.request_type || "HR Request"}`;

    content.appendChild(heading);

    const details = document.createElement("div");
    details.classList.add("assigned-item-details");

    const fields = [
        {
            label: "Submitted Date",
            value: request.submission_date
                ? formatDateForDisplay(request.submission_date)
                : "Not Available"
        },
        {
            label: "Status",
            value: request.status || "Not Available"
        },
        {
            label: "Summary",
            value: request.brief_summary || "No summary provided."
        }
    ];

    fields.forEach(field => {
        const detail = document.createElement("div");
        detail.classList.add("assigned-detail");

        const label = document.createElement("span");
        label.classList.add("detail-label");
        label.textContent = field.label;

        const value = document.createElement("span");
        value.classList.add("detail-value");
        value.textContent = field.value;

        detail.append(label, value);
        details.appendChild(detail);
    });

    content.appendChild(details);

    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.classList.add("item-action");
    viewButton.textContent = "View Request →";

    // Navigate to Request Details
    const openRequest = () => {
        sessionStorage.setItem(
            "requestReturnPage",
            "my-requests"
        );

        loadPage("view-request", requestId);
    };

    // Allow selection anywhere on the request card
    card.addEventListener("click", openRequest);

    card.append(content, viewButton);

    return card;
}

// ============================================================
// LOAD MY REQUESTS
// ============================================================

export async function loadMyRequestsPage() {
    const contentArea =
        document.getElementById("contentArea");

    const page = document.createElement("div");

    page.innerHTML = `
        <h3>My Requests</h3>
        <hr>

        <p>
            Review your submitted HR requests,
            monitor their progress, and access
            request details.
        </p>

        <div class="request-filters">
            <div class="form-group">
                <label for="request-search">
                    Search Requests
                </label>

                <input
                    type="search"
                    id="request-search"
                    placeholder="Search by ID, type, or summary"
                >
            </div>

            <div class="form-group">
                <label for="request-status-filter">
                    Filter by Status
                </label>

                <select id="request-status-filter">
                    <option value="all">All Statuses</option>
                </select>
            </div>
        </div>

        <section aria-labelledby="active-requests-heading">
            <h3 id="active-requests-heading">
                Active Requests
            </h3>

            <div id="employee-active-requests"></div>
        </section>

        <section aria-labelledby="completed-requests-heading">
            <h3 id="completed-requests-heading">
                Completed Requests
            </h3>

            <div id="employee-completed-requests"></div>
        </section>
    `;

    contentArea.replaceChildren(page);

    const activeList =
        page.querySelector("#employee-active-requests");

    const completedList =
        page.querySelector("#employee-completed-requests");

    const searchInput =
        page.querySelector("#request-search");

    const statusFilter =
        page.querySelector("#request-status-filter");

    activeList.textContent = "Loading requests...";

    try {
        const requests = await getMyRequests();

        if (!Array.isArray(requests)) {
            throw new Error("Invalid request data received.");
        }

        // Populate status options from the returned requests.
        const statuses = [
            ...new Set(
                requests
                    .map(request => request.status)
                    .filter(Boolean)
            )
        ].sort();

        statuses.forEach(status => {
            const option = document.createElement("option");
            option.value = status;
            option.textContent = status;

            statusFilter.appendChild(option);
        });

        // ====================================================
        // RENDER FILTERED REQUESTS
        // ====================================================

        function renderRequests() {
            const searchTerm =
                searchInput.value.trim().toLowerCase();

            const selectedStatus = statusFilter.value;

            const filteredRequests = requests.filter(request => {
                const searchableText = [
                    request.request_id,
                    request.request_type,
                    request.brief_summary
                ].join(" ").toLowerCase();

                const matchesSearch =
                    searchableText.includes(searchTerm);

                const matchesStatus =
                    selectedStatus === "all" ||
                    request.status === selectedStatus;

                return matchesSearch && matchesStatus;
            });

            const activeRequests = filteredRequests.filter(
                request => request.status_code !== "complete"
            );

            const completedRequests = filteredRequests.filter(
                request => request.status_code === "complete"
            );

            activeList.replaceChildren();
            completedList.replaceChildren();

            if (activeRequests.length === 0) {
                activeList.textContent =
                    "No matching active requests found.";
            } else {
                activeRequests.forEach(request => {
                    activeList.appendChild(
                        createEmployeeRequestCard(request)
                    );
                });
            }

            if (completedRequests.length === 0) {
                completedList.textContent =
                    "No matching completed requests found.";
            } else {
                completedRequests.forEach(request => {
                    completedList.appendChild(
                        createEmployeeRequestCard(request)
                    );
                });
            }
        }

        searchInput.addEventListener("input", renderRequests);
        statusFilter.addEventListener("change", renderRequests);

        renderRequests();

    } catch (error) {
        console.error(
            "Unable to load employee requests:",
            error
        );

        activeList.textContent =
            error.message || "Unable to load your requests.";

        completedList.replaceChildren();
    }
}
