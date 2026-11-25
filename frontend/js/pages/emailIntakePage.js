// Simulated Email Intake for Authorized HR Staff.
// Uses the existing email intake API and normal HR request workflow.

import {
    createEmailIntakeRequest,
    getActiveRequestTypes
} from "../api/requestApi.js";
import { loadPage } from "../router.js";

export async function loadEmailIntakePage() {
    const contentArea = document.getElementById("contentArea");

    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
        <h3>Simulated Email Intake</h3>
        <hr>
        <p>Enter the details of an employee email received by HR.</p>

        <form id="email-intake-form">
            <div class="form-field">
                <label for="email-employee">Employee Email Address</label>
                <input type="email" id="email-employee"
                    maxlength="254" required
                    placeholder="employee@example.com">
            </div>

            <div class="form-field">
                <label for="email-request-type">Request Type</label>
                <select id="email-request-type" required>
                    <option value="">Select Request Type</option>
                </select>
            </div>

            <div class="form-field">
                <label for="email-subject">Email Subject</label>
                <input type="text" id="email-subject"
                    maxlength="150" required>
            </div>

            <div class="form-field">
                <label for="email-body">Email Body</label>
                <textarea id="email-body" rows="6"
                    maxlength="1800" required></textarea>
            </div>

            <div class="form-actions">
                <button type="reset">Clear Form</button>
                <button type="submit" id="submit-email-request" disabled>
                    Create HR Request
                </button>
            </div>

            <p id="email-intake-message" class="feedback"
                role="status" aria-live="polite"></p>
        </form>

        <button type="button" id="view-new-requests">
            View New Requests
        </button>
    `;

    contentArea.replaceChildren(card);

    const form = card.querySelector("#email-intake-form");
    const requestType = card.querySelector("#email-request-type");
    const submitButton = card.querySelector("#submit-email-request");
    const message = card.querySelector("#email-intake-message");

    // Reuse existing request types. Email is an intake source, not a type.
    try {
        const types = await getActiveRequestTypes();
        const requestTypes = types.filter(type => type.name !== "Email Intake");

        if (requestTypes.length === 0) {
            throw new Error("No request types are available.");
        }

        requestTypes.forEach(type => {
            const option = document.createElement("option");
            option.value = type.request_type_id;
            option.textContent = type.name;
            requestType.appendChild(option);
        });

        submitButton.disabled = false;
    } catch (error) {
        message.textContent = error.message || "Unable to load request types.";
        message.classList.add("error");
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        const subject = card.querySelector("#email-subject").value.trim();
        const body = card.querySelector("#email-body").value.trim();
        const email = card.querySelector("#email-employee").value.trim();
        const briefSummary = `Subject: ${subject}\n\n${body}`;

        if (!subject || !body || briefSummary.length > 2000) {
            message.textContent = "Enter a subject and body within the allowed length.";
            message.classList.remove("success");
            message.classList.add("error");
            return;
        }

        message.textContent = "";
        message.classList.remove("success", "error");
        submitButton.disabled = true;

        try {
            const created = await createEmailIntakeRequest({
                employee_email: email,
                request_type_id: Number(requestType.value),
                brief_summary: briefSummary
            });

            form.reset();
            message.textContent =
                `Email request #${created.request_id} created. ` +
                "It is now available in New Requests.";
            message.classList.add("success");
        } catch (error) {
            message.textContent = error.message || "Unable to create request.";
            message.classList.add("error");
        } finally {
            submitButton.disabled = false;
        }
    });

    card.querySelector("#view-new-requests").addEventListener("click", () => {
        loadPage("new-requests");
    });
}
