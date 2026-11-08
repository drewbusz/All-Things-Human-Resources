// ============================================================
// UC-3: Assign and Prioritize HR Request
// Authorized Staff Workspace
// ============================================================
//
// Displays the selected request and allows an authorized staff
// member to assign an HR processor, set priority, and establish
// an expected completion date.
//
// Changes are saved through the existing PATCH request API.
// ============================================================

import {
    getRequestById,
    saveRequestAssignment,
    getActiveRequestTypes
} from "../api/requestApi.js";
import {
    renderAuthorizedRequestProcessingForm
} from "../utils/requestRenderHelper.js"; 
import { getAssignableEmployees } from "../api/employeeApi.js";
import { formatDateForDisplay } from "../utils/dateHelper.js";
import { loadPage } from "../router.js";


export async function loadAssignRequestPage(requestId, actingEmployeeId) {

    const contentArea = document.getElementById("contentArea");

    try {
        // Load the request and eligible HR employees.
       
        const [request, employees, activeRequestTypes] =
            await Promise.all([
                getRequestById(requestId, actingEmployeeId),
                getAssignableEmployees(), 
                getActiveRequestTypes(),
            ]);

        if (!request || typeof request !== "object") {
            throw new Error("Unable to retrieve the selected request.");
        }
        if (!Array.isArray(employees)) {
            throw new Error(
                "Unable to retrieve assignable employees."
            );
        }
        if (!Array.isArray(activeRequestTypes)) {
            throw new Error(
                "Unable to retrieve active request types."
            );
        }

        // Create the page using existing application styles.
        const staticCard = document.createElement("div");
        staticCard.classList.add("card"); 

        staticCard.innerHTML = `
            <h3>Assign & Prioritize | Request #${request.request_id}</h3>
            <hr>

            <div class="card-row">
                <div class="info-item">
                    <span class="info-label">Current Request Type</span>
                    <span class="info-value" id="assignment-type"></span>
                </div>

                <div class="info-item">
                    <span class="info-label">Submitted By</span>
                    <span class="info-value" id="assignment-submitter"></span>
                </div>

                <div class="info-item">
                    <span class="info-label">Submitted Date</span>
                    <span class="info-value" id="assignment-date"></span>
                </div>
            </div>

            <hr>

            <div class="info-item">
                <span class="info-label">Request Summary</span>
                <span class="info-value" id="assignment-summary"></span>
            </div>
        `;

        // Populate static request information
        staticCard.querySelector("#assignment-type").textContent =
            request.request_type ?? "";

        staticCard.querySelector("#assignment-submitter").textContent =
            request.submitted_by ?? "";

        staticCard.querySelector("#assignment-date").textContent =
            formatDateForDisplay(request.submission_date);

        staticCard.querySelector("#assignment-summary").textContent =
            request.brief_summary ?? "";

        // Render the authorized request processing form
        const requestForm =
            renderAuthorizedRequestProcessingForm(
                request, 
                employees, 
                activeRequestTypes
            ); 

        // Display both cards 
        contentArea.replaceChildren(
            staticCard, 
            requestForm
        ); 
        // Return to the unassigned request queue.
        requestForm.querySelector("#back-to-unassigned")
            .addEventListener("click", () => {
                loadPage("unassigned-requests");
            });

        // Submit assignment values through the existing backend.
        requestForm.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                const message =
                    requestForm.querySelector("#assignment-message");

                const saveButton =
                    event.currentTarget.querySelector(
                        'button[type="submit"]'
                    );

                saveButton.disabled = true;
                message.textContent = "Saving assignment...";

                const employeeSelect =
                    requestForm.querySelector("#assigned-employee");

                const updateData = {
                    actingEmployeeId: actingEmployeeId,
                    assigned_emp_id: Number(employeeSelect.value),
                    request_type_id:
                        Number(
                            requestForm.querySelector("#request-type").value
                        ),
                    priority_level:
                        requestForm.querySelector("#assignment-priority").value,
                    expected_completion:
                        requestForm.querySelector("#assignment-completion").value
                };

                try {
                    // Send assignment data through the frontend API module.
                    await saveRequestAssignment(requestId, updateData);

                    // Save a confirmation for the destination page.
                    // The request has been successfully assigned.
                    const confirmation = {
                        requestId: request.request_id,
                        employeeName:
                            employeeSelect.options[employeeSelect.selectedIndex].text
                    };


                    // Return to the queue and display the confirmation.
                    loadPage("unassigned-requests", null, null, confirmation);

                } catch (error) {
                    console.error(error);

                    message.textContent =
                        error.message ||
                        "Unable to save assignment.";

                    message.classList.remove("success");
                    message.classList.add("error");
                } finally {
                    saveButton.disabled = false; 
                }
            });
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
            "Unable to load assignment page.";
    }
}