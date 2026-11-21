// Manage Assigned Approvals Workspace
import { getMyApprovals } from "../api/requestApi.js";
import { renderRequestRows } from "../utils/requestRenderHelper.js";
import { loadPage } from "../router.js";


// =================================
// LOAD MY ASSIGNED APPROVALS
// ================================

export async function loadMyAssignedApprovals(
    confirmation = null
) {

    const contentArea =
        document.getElementById("contentArea");
    try {
        // Retrieve approvals assigned to the manager

        const approvals =
            await getMyApprovals();

        // Build approval pipeline
        const pipeline =
            document.createElement("div");

        pipeline.classList.add("approval-pipeline");

        pipeline.innerHTML = `
            <h3>My Assigned Approvals</h3>
            <hr>

            <p>
                Select an approval request to review the
                request information and submit your decision.
            </p>

            <div id="assigned-approval-list"></div>
        `;
        // Display the page
        contentArea.replaceChildren(pipeline);

        // Display confirmation

        if (confirmation) {

            const notice =
                document.createElement("div");

            notice.className = "action-success";
            notice.setAttribute("role", "status");

            notice.textContent =
                confirmation.message ||
                "Manager decision submitted successfully.";

            contentArea.prepend(notice);
        }

        // Reference approval list
        const approvalList =
            pipeline.querySelector("#assigned-approval-list");

        // Handle empty approval list
        if (approvals.length === 0) {
            approvalList.textContent =
                "You have no pending approval requests.";

            return;
        }

        // Render approval cards
        const approvalRows =
            renderRequestRows(approvals);

        approvalList.innerHTML = approvalRows;


        // Approval card navigation
        const approvalCards =
            approvalList.querySelectorAll(".item-card");

        approvalCards.forEach(card => {

            card.addEventListener("click", () => {

                const requestId =
                    card.dataset.requestId;

                console.log(
                    "Selected approval request:",
                    requestId
                );
                // Store this page for the Back button
                sessionStorage.setItem(
                    "requestReturnPage",
                    "my-approvals"
                );

                // Navigate to manager approval page
                loadPage(
                    "approval-request",
                    requestId
                );

            });

        });

    } catch (error) {

        // Handle errors
        console.error(error);

        contentArea.innerHTML = `
            <div class="card">
                <p id="approval-error-message"></p>
            </div>
        `;

        contentArea
            .querySelector("#approval-error-message")
            .textContent =
            error.message ||
            "Unable to load assigned approvals.";

    }
}
