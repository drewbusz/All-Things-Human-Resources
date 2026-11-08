/**
 * UC-1: Employee — Submit HR Request
 *
 * Allows an employee to submit a new HR request.
 */

export async function loadSubmitRequestPage(actingEmployeeId) {
    const contentArea = document.getElementById("contentArea");

    contentArea.innerHTML = `
        <div class="card">
            <h3>Submit New HR Request</h3>
            <hr>
            <p>Complete the form below to submit a request to HR.</p>

            <form id="submit-request-form">
                <div class="form-field">
                    <label for="request-type">Request Type</label>
                    <select id="request-type" required>
                        <option value="">Select Request Type</option>
                    </select>
                </div>

                <div class="form-field">
                    <label for="request-description">Request Description</label>
                    <textarea
                        id="request-description"
                        rows="6"
                        maxlength="2000"
                        placeholder="Describe what you need assistance with..."
                        required
                    ></textarea>
                </div>

                <div class="form-actions">
                    <button type="reset">Clear Form</button>
                    <button type="submit" id="submit-request-button">
                        Submit Request
                    </button>
                </div>

                <p id="submission-message" role="status" aria-live="polite"></p>
            </form>
        </div>
    `;

    const form = contentArea.querySelector("#submit-request-form");
    const requestType = contentArea.querySelector("#request-type");
    const description = contentArea.querySelector("#request-description");
    const submitButton = contentArea.querySelector("#submit-request-button");
    const message = contentArea.querySelector("#submission-message");

    // Retrieve available request types.
    try {
        const response = await fetch("/api/requests/activeRequestTypes");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to load request types.");
        }

        requestType.innerHTML = `
            <option value="">Select Request Type</option>
            ${result.data.map(type => `
                <option value="${type.request_type_id}">
                    ${type.name}
                </option>
            `).join("")}
        `;
    } catch (error) {
        requestType.innerHTML =
            `<option value="">Request types unavailable</option>`;
        message.textContent =
            "Unable to load request types. Please try again.";
        submitButton.disabled = true;
    }

    // Submit the new request.
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        message.textContent = "";

        if (!form.reportValidity()) return;

        if (!description.value.trim()) {
            message.textContent = "Please enter a request description.";
            description.focus();
            return;
        }

        submitButton.disabled = true;

        try {
            const response = await fetch("/api/requests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    actingEmployeeId,
                    request_type_id: Number(requestType.value),
                    brief_summary: description.value.trim()
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Request submission failed.");
            }

            form.reset();

            message.textContent =
                `HR request submitted successfully. ` +
                `Your Request ID is #${result.data.request_id}.`;

        } catch (error) {
            message.textContent = error.message;
        } finally {
            submitButton.disabled = false;
        }
    });

    form.addEventListener("reset", () => {
        message.textContent = "";
    });
}