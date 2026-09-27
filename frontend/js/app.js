// Request used for the Assignment 4 UC-4 vertical slice.
const requestId = 1;
const employeeId = 2;

// References to the HTML elements that will display request data.
const requestIdElement = document.getElementById("request-id");
const requestTypeElement = document.getElementById("request-type");
const requestSummaryElement = document.getElementById("request-summary");
const requestPriorityElement = document.getElementById("request-priority");
const currentStatusElement = document.getElementById("current-status");
const expectedCompletionElement = document.getElementById("expected-completion");
const statusSelectElement = document.getElementById("status-select");
const statusMessageElement = document.getElementById("status-message");
const saveStatusButton = document.getElementById("save-status");

// Retrieves the request from the backend and displays its current data.
async function loadRequest() {
    try {
        const response = await fetch(`/api/requests/${requestId}?employeeId=${employeeId}`);

        if (!response.ok) {
            throw new Error("Unable to retrieve the request.");
        }

        const result = await response.json();
        const request = result.data;

        requestIdElement.textContent = request.request_id;
        requestTypeElement.textContent = request.request_type;
        requestSummaryElement.textContent = request.brief_summary;

        // Capitalizes the stored priority value for display.
        requestPriorityElement.textContent =
            request.priority_level.charAt(0).toUpperCase() +
            request.priority_level.slice(1);

        currentStatusElement.textContent = request.status;

        // Formats the database date for display in the interface.
        const expectedCompletionDate = new Date(request.expected_completion);

        expectedCompletionElement.textContent =
            expectedCompletionDate.toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric"
            });

        // Keep the status control synchronized with the persisted request status.
        statusSelectElement.value = request.status;

    } catch (error) {
        statusMessageElement.textContent =
            "The request could not be loaded.";
    }
}

// Sends the selected workflow status to the backend for persistence.
async function updateRequestStatus() {
    try {
        statusMessageElement.textContent = "";

        const response = await fetch(
            `/api/requests/${requestId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    employeeId: employeeId,
                    status: statusSelectElement.value
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to update the request.");
        }

        // Display the status returned from the persisted request.
        currentStatusElement.textContent = result.data.status;
        statusSelectElement.value = result.data.status;
        statusMessageElement.textContent = result.message;

    } catch (error) {
        statusMessageElement.textContent = error.message;
    }
}

// Save the selected status when the HR staff member initiates the update.
saveStatusButton.addEventListener("click", updateRequestStatus);

// Load the persisted request when the interface opens.
loadRequest();
