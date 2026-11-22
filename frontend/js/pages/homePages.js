
// ===================================================
// Home pages
// ===================================================
import { loadPage } from "../router.js";

// Processing Home Page
export async function loadProcessingHomePage(
) {

    const contentArea =
        document.getElementById("contentArea");

    try {
        const welcomePage =
            document.createElement("div");

        welcomePage.classList.add("home-page");

        welcomePage.innerHTML = `
            <h3>HR Processing Workspace</h3>
            <p>
                Welcome to the HR Processing workspace.
                Select a section below to continue.
            </p>
            <hr>
            <div class="home-page-cards">
                
            <div class="home-page-card" id="assignedRequestsCard">
            <h3>Assigned Requests</h3>

            <p>
                Review and process requests currently
                assigned to you.
            </p>

            <span class="card-link">
                View Assigned Requests →
            </span>
            </div>
        </div>
        `;
        contentArea.replaceChildren(welcomePage);

        // =============================
        // NAVIGATE EVENT LISTENERS
        // =============================

        document.getElementById("assignedRequestsCard")
            .addEventListener("click", () => {
                loadPage("assigned-requests");
            });

    } catch (error) {
        console.error(
            "Unable to load HR Processing Workspace:",
            error
        );
        contentArea.textContent =
            `Unable to load the HR Processing Workspace: ${error.message}`;
    }
}

// Authorized HR Home Page
export async function loadAuthorizedHomePage(
) {
    const contentArea =
        document.getElementById("contentArea");

    try {
        const welcomePage =
            document.createElement("div");
        welcomePage.classList.add("home-page");

        welcomePage.innerHTML = `
            <h3>Authorized Staff Workspace</h3>
            <p>
                Welcome to the Authorized HR Staff Workspace.
                Select a section below to continue.
            </p>
            <hr>
            <div class="home-page-cards">
                <div class="home-page-card"
                    data-page="new-requests">
                    <h3>New Requests</h3>
                    <p>
                        Review active requests awaiting intake and processing.
                    </p>

                    <span class="card-link">
                        View Pending Requests →
                    </span>
                </div>
                <div class="home-page-card"
                    data-page="unassigned-requests">
                    <h3>Unassigned Requests</h3>
                    <p>
                        Review active requests awaiting intake and processing.
                    </p>

                    <span class="card-link">
                        View Unassigned Requests →
                    </span>
                </div>
                <div class="home-page-card"
                    data-page="active-requests">
                    <h3>All Active Requests</h3>
                    <p>
                        Review all active and incomplete requests.
                    </p>

                    <span class="card-link">
                        View All Active Requests →
                    </span>
                </div>
            </div>
        `;
        contentArea.replaceChildren(welcomePage);

        // =============================
        // NAVIGATE EVENT LISTENER
        // =============================
        const homePageCards =
            welcomePage.querySelector(".home-page-cards");

        homePageCards.addEventListener("click", (event) => {
            // Identify the selected card
            const selectedCard =
                event.target.closest(".home-page-card");

            // Ignore clicks outside of a card 
            if (!selectedCard) return;

            // Retrieve the destination page 
            const destination =
                selectedCard.dataset.page;

            // Navigate to the selected page 
            loadPage(destination);
        });
    } catch (error) {
        console.error(
            "Unable to load Authorized Staff Workspace:",
            error
        );

        contentArea.textContent =
            `Unable to load the Authorized Staff Workspace: ${error.message || "An unexpected error occurred."
            }`;
    }
}
// Employee Home Page

export async function loadEmployeeHomePage() {
    const contentArea =
        document.getElementById("contentArea");

    try {
        const welcomePage =
            document.createElement("div");

        welcomePage.classList.add("home-page");

        welcomePage.innerHTML = `
            <h3>Employee Workspace</h3>
            <p>
                Welcome to the Employee Workspace.
                Select a section below to continue.
            </p>
            <hr>

            <div class="home-page-cards">
                <div class="home-page-card"
                    data-page="submit-request">
                    <h3>Submit New Request</h3>
                    <p>
                        Create and submit a new request
                        to Human Resources.
                    </p>

                    <span class="card-link">
                        Submit New Request →
                    </span>
                </div>

                <div class="home-page-card"
                    data-page="my-requests">
                    <h3>My Requests</h3>
                    <p>
                        View your submitted requests,
                        check their status, and review
                        request details and history.
                    </p>

                    <span class="card-link">
                        View My Requests →
                    </span>
                </div>

                <!-- Employee History temporarily hidden pending team review.
                <div class="home-page-card"
                    data-page="employee-history">
                    <h3>Employee History</h3>
                    <p>
                        Review your available employee
                        history information.
                    </p>

                    <span class="card-link">
                        View Employee History →
                    </span>
                </div>
                -->
            </div>
        `;

        contentArea.replaceChildren(welcomePage);

        const homePageCards =
            welcomePage.querySelector(".home-page-cards");

        homePageCards.addEventListener("click", (event) => {
            const selectedCard =
                event.target.closest(".home-page-card");

            if (!selectedCard) return;

            const destination =
                selectedCard.dataset.page;

            loadPage(destination);
        });

    } catch (error) {
        console.error(
            "Unable to load Employee Workspace:",
            error
        );

        contentArea.textContent =
            `Unable to load the Employee Workspace: ${error.message || "An unexpected error occurred."
            }`;
    }
}


// Manager Home Page 
export async function loadManagerHomePage(
) {
    const contentArea =
        document.getElementById("contentArea");

    try {
        const welcomePage =
            document.createElement("div");

        welcomePage.classList.add("home-page");

        welcomePage.innerHTML = `
            <h3>Manager Workspace</h3>
            <p>
                Welcome to the Management Workspace.
                Select a section below to continue.
            </p>
            <hr>
            <div class="home-page-cards"> 
                <div class="home-page-card"
                    data-page="pending-approvals">
                <h3>Pending Approval Requests</h3>
                <p>
                    Review requests pending your approval.
                </p>

                <span class="card-link">
                    View Pending Approvals →
                </span>
                </div>
                <div class="home-page-card"
                    data-page="my-team">
                <h3>See My Team</h3>
                <p>
                    See information about the employees on your team. 
                </p>

                <span class="card-link">
                    View Your Team →
                </span>
                </div>
            </div>
        `;

        contentArea.replaceChildren(welcomePage);

        // =============================
        // NAVIGATE EVENT LISTENER
        // =============================
        const homePageCards =
            welcomePage.querySelector(".home-page-cards");

        homePageCards.addEventListener("click", (event) => {
            // Identify the selected card
            const selectedCard =
                event.target.closest(".home-page-card");

            // Ignore clicks outside of a card
            if (!selectedCard) return;

            const destination =
                selectedCard.dataset.page;

            loadPage(destination);
        });

    } catch (error) {
        console.error(
            "Unable to load Manager Workspace:",
            error
        );

        contentArea.textContent =
            `Unable to load the Manager Workspace: ${error.message || "An unexpected error occurred."
            }`;
    }
}