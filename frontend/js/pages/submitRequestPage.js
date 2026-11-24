
/**
 * UC-1: Employee — Submit HR Request
 *
 * Allows an employee to submit a new HR request.
 */

import { getTypeFields } from "../api/requestApi.js";

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

                <div id="request-type-fields"></div>

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
    const fieldContainer = contentArea.querySelector("#request-type-fields");
    const description = contentArea.querySelector("#request-description");
    const submitButton = contentArea.querySelector("#submit-request-button");
    const message = contentArea.querySelector("#submission-message");
    let fieldLoadId = 0;

    // Retrieve available request types.
    submitButton.disabled = true;
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

    // Show the fields configured for the selected request type.
    requestType.addEventListener("change", async () => {
        const thisLoadId = ++fieldLoadId;
        fieldContainer.replaceChildren();
        message.textContent = "";
        submitButton.disabled = true;

        if (!requestType.value) return;

        try {
            const fields = await getTypeFields(requestType.value);
            if (thisLoadId !== fieldLoadId) return;

            fields.forEach(field => {
                const fieldId = `field-${field.field_id}`;
                const row = document.createElement("div");
                row.className = "field-item";

                const label = document.createElement("label");
                label.className = "field-label";
                label.htmlFor = fieldId;
                label.textContent = field.field_label;

                const valueContainer = document.createElement("div");
                valueContainer.className = "field-value";

                let input;
                if (field.field_type === "textarea") {
                    input = document.createElement("textarea");
                    input.maxLength = 255;
                } else {
                    input = document.createElement("input");
                    input.type = ["date", "number"].includes(field.field_type)
                        ? field.field_type
                        : "text";
                    if (input.type === "number") input.step = "any";
                    if (input.type === "text") input.maxLength = 255;
                }

                input.id = fieldId;
                input.dataset.fieldId = field.field_id;
                input.required = Boolean(field.is_required);

                valueContainer.appendChild(input);
                row.append(label, valueContainer);
                fieldContainer.appendChild(row);
            });

            submitButton.disabled = false;
        } catch (error) {
            if (thisLoadId !== fieldLoadId) return;
            message.textContent =
                error.message || "Unable to load request fields.";
        }
    });

    // Submit the new request and its dynamic field values together.
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        message.textContent = "";

        if (!form.reportValidity()) return;

        if (!description.value.trim()) {
            message.textContent = "Please enter a request description.";
            description.focus();
            return;
        }

        const fieldValues = [...fieldContainer.querySelectorAll("[data-field-id]")]
            .map(field => ({
                field_id: Number(field.dataset.fieldId),
                field_val: field.value.trim()
            }));

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
                    brief_summary: description.value.trim(),
                    fieldValues
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
            submitButton.disabled = false;
        }
    });

    form.addEventListener("reset", () => {
        ++fieldLoadId;
        fieldContainer.replaceChildren();
        submitButton.disabled = true;
        message.textContent = "";
    });
}
