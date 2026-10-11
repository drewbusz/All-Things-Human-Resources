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

import { getRequestById, saveRequestAssignment } from "../api/requestApi.js";
import { getEmployeesByAuthType } from "../api/employeeApi.js";
import { formatDateForDisplay } from "../utils/dateHelper.js";
import { loadPage } from "../router.js";


// Temporary acting employee for the class prototype.
// Backend authorization must be reviewed before production use.
const ACTING_EMPLOYEE_ID = 2;
const HR_MODIFICATION_AUTH_TYPE = 3;


export async function loadAssignRequestPage(requestId) {

    const contentArea = document.getElementById("contentArea");

    try {
        // Load the request and eligible HR employees.
        const [request, employees] = await Promise.all([
            getRequestById(requestId),
            getEmployeesByAuthType(HR_MODIFICATION_AUTH_TYPE)
        ]);

        if (!request || typeof request !== "object") {
            throw new Error("Unable to retrieve the selected request.");
        }

        // Create the page using existing application styles.
        const page = document.createElement("div");
        page.className = "card";

        page.innerHTML = `
            <h3>Assign & Prioritize | Request #${request.request_id}</h3>
            <hr>

            <div class="card-row">
                <div class="info-item">
                    <span class="info-label">Request Type</span>
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

            <hr>

            <form id="assignment-form">

                <div class="form-field">
                    <label for="assigned-employee">Assigned To</label>
                    <select id="assigned-employee" required>
                        <option value="">Select HR Employee</option>
                    </select>
                </div>

                <div class="form-field">
                    <label for="assignment-priority">Priority Level</label>
                    <select id="assignment-priority" required>
                        <option value="">Select Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>

                <div class="form-field">
                    <label for="assignment-completion">
                        Expected Completion
                    </label>
                    <input
                        type="date"
                        id="assignment-completion"
                        required
                    >
                </div>
                <div class="form-actions">
                    <button type="submit">Save Assignment</button>
                </div>

                <p id="assignment-message" role="status"></p>
            </form>

            <button type="button" id="back-to-unassigned">
                Back to Unassigned Requests
            </button>
        `;

        // Populate read-only request information safely.
        page.querySelector("#assignment-type").textContent =
            request.request_type;

        page.querySelector("#assignment-submitter").textContent =
            request.submitted_by;

        page.querySelector("#assignment-date").textContent =
            formatDateForDisplay(request.submission_date);

        page.querySelector("#assignment-summary").textContent =
            request.brief_summary;

        // Populate the assignment dropdown.
        const employeeSelect =
            page.querySelector("#assigned-employee");

        employees.forEach(employee => {
            const option = document.createElement("option");
            option.value = employee.employee_id;
            option.textContent =
                `${employee.first_name} ${employee.last_name}`;

            employeeSelect.appendChild(option);
        });

        // Return to the unassigned request queue.
        page.querySelector("#back-to-unassigned")
            .addEventListener("click", () => {
                loadPage("unassigned-requests");
            });

        // Submit assignment values through the existing backend.
        page.querySelector("#assignment-form")
            .addEventListener("submit", async event => {
                event.preventDefault();

                const message =
                    page.querySelector("#assignment-message");

                const saveButton =
                    event.currentTarget.querySelector(
                        'button[type="submit"]'
                    );

                saveButton.disabled = true;
                message.textContent = "Saving assignment...";

                const updateData = {
                    actingEmployeeId: ACTING_EMPLOYEE_ID,
                    assigned_emp_id: Number(employeeSelect.value),
                    priority_level:
                        page.querySelector("#assignment-priority").value,
                    expected_completion:
                        page.querySelector("#assignment-completion").value
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
                    message.textContent = error.message;
                    saveButton.disabled = false;
                }
            });

        contentArea.appendChild(page);

    } catch (error) {
        contentArea.textContent =
            error.message || "Unable to load assignment page.";
    }
}