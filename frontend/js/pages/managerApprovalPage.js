// Manager Approval processing page

import {
    getRequestApproval,
    decideApproval
} from "../api/requestApi.js";

// Navigation
import {
    loadPage
} from "../router.js";

// Render Helpers
import {
    renderManagerApprovalForm
} from "../utils/requestRenderHelper.js";

// Formatting Helpers
import {
    formatDateForDisplay
} from "../utils/dateHelper.js";

import {
    formatFieldName
} from "../utils/textFormatHelper.js";


// ============================================================
// LOAD MANAGER APPROVAL PAGE
// ============================================================

export async function loadManagerApprovalPage(
    requestId,
    confirmation = null
) {

    const contentArea =
        document.getElementById("contentArea");

    try {

        // The approval endpoint returns the authorized request information and fields.
        const approval = await getRequestApproval(requestId);
        const request = approval.request;
        const typeFields = approval.typeFields ?? [];
        const fieldValues = approval.fieldValues ?? [];

        

        // --------------------------------
        // Static Request Information
        // --------------------------------

        const staticCard =
            document.createElement("div");

        staticCard.classList.add("card");

        staticCard.innerHTML = `
            <h3>Approval Request Information</h3>
            <hr>

            <div class="card-row">

                <div class="info-item">
                    <span class="info-label">Request Type</span>
                    <span class="info-value" id="request-type"></span>
                </div>

                <div class="info-item">
                    <span class="info-label">Submitted By</span>
                    <span class="info-value" id="submitted-by"></span>
                </div>

                <div class="info-item">
                    <span class="info-label">Request Date</span>
                    <span class="info-value" id="submission-date"></span>
                </div>

                <div class="info-item">
                    <span class="info-label">Priority</span>
                    <span class="info-value" id="priority"></span>
                </div>

            </div>

            <div class="form-field">
                <span class="info-label">Request Summary</span>
                <p id="request-summary"></p>
            </div>

            <div class="form-field">
                <span class="info-label">Approval Summary</span>
                <p id="approval-summary"></p>
            </div>
        `;


        // Populate request information
        staticCard.querySelector("#request-type").textContent =
            request.request_type ?? "";

        staticCard.querySelector("#submitted-by").textContent =
            formatFieldName(request.submitted_by);

        staticCard.querySelector("#submission-date").textContent =
            formatDateForDisplay(request.submission_date);

        staticCard.querySelector("#priority").textContent =
            formatFieldName(request.priority_level);

        staticCard.querySelector("#request-summary").textContent =
            request.brief_summary ?? "";

        // Adjust this property to match the actual GET approval response
        staticCard.querySelector("#approval-summary").textContent =
            approval.summary ?? "";


        // --------------------------------
        // Manager Approval Form
        // --------------------------------

        const approvalForm =
            renderManagerApprovalForm(
                requestId,
                typeFields,
                fieldValues
            );


        // --------------------------------
        // Render Page
        // --------------------------------

        contentArea.replaceChildren(staticCard);

        if (confirmation) {

            const confirmationMessage =
                document.createElement("div");

            confirmationMessage.classList.add("success-notification");

            confirmationMessage.textContent = confirmation;

            contentArea.appendChild(confirmationMessage);
        }

        contentArea.appendChild(approvalForm);


        // --------------------------------
        // Form Submission
        // --------------------------------

        approvalForm.addEventListener("submit", async event => {

            event.preventDefault();

            const decisionField =
                approvalForm.querySelector('[name="decision"]');

            const message =
                approvalForm.querySelector(".feedback");

            const submitButton =
                approvalForm.querySelector('[type="submit"]');

            const decision = decisionField?.value;

            if (!decision) {

                message.textContent =
                    "Please select a manager decision.";

                message.classList.remove("success");
                message.classList.add("error");

                decisionField?.focus();

                return;
            }

            submitButton.disabled = true;

            try {

                // Submit manager decision
                await decideApproval(requestId, decision);

                // Retrieve the previous page
                const previousPage = sessionStorage.getItem("requestReturnPage") || "pending-approvals"; 

                // Prepare confrimation message
                const confirmation = {
                    requestId: requestId,
                    message: `Manager decision submitted successfully for request ID: ${requestId}`
                }; 

                sessionStorage.removeItem("requestReturnPage"); 

                // Reload page with confirmation
                loadPage(previousPage, null, confirmation); 

            } catch (error) {

                console.error(
                    "Manager approval submission failed:",
                    error
                );

                message.textContent =
                    error.message ||
                    "Unable to submit manager decision.";

                message.classList.remove("success");
                message.classList.add("error");

                submitButton.disabled = false;
            }
        });

        // --------------------------------
        // Back Button
        // --------------------------------

        const backButton =
            approvalForm.querySelector("#back-button");

        if (backButton) {

            backButton.addEventListener("click", () => {
                const previousPage =
                    sessionStorage.getItem("requestReturnPage")
                    || "pending-approvals";

                sessionStorage.removeItem("requestReturnPage");
                loadPage(previousPage);
            });
        }


    } catch (error) {
        console.error(error);
        contentArea.textContent =
            error.message ||
            "Unable to load manager approval request.";
    }
}