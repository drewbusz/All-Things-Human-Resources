// ==================================================
// router.js
// Controls front end page routing and page specializations
// based on user type (employee, HR staff, Manager)
// ==================================================

// importing navigation specializations

import { loadNavigation } from "./navigation.js";

// importing specific pages 
import { loadProcessingHomePage } from "./pages/processingHomePage.js";
import { loadProcessRequestPage } from "./pages/processRequestPage.js";
import { loadNewRequestPage } from "./pages/newRequestPage.js";
import { loadMyAssignedRequests } from "./pages/myAssignedRequestsPage.js";
import { loadUnassignedRequests } from "./pages/unassignedRequestsPage.js";
import { loadAssignRequestPage } from "./pages/assignRequestPage.js";

// Display a consistent placeholder for unfinished pages.
function showPagePlaceholder(title, description) {
    const contentArea = document.getElementById("contentArea");

    contentArea.innerHTML = `
        <div class="card">
            <h2>${title}</h2>
            <hr>
            <p>${description}</p>
            <p>This feature is pending implementation.</p>
        </div>
    `;
}


export function loadPage(page, requestId = null, actingEmployeeId = null, confirmation = null) {

    const contentArea = document.getElementById("contentArea");
    contentArea.innerHTML = ``;
    switch (page) {

        //=================//
        // HR Staff Pages // 
        // hr staff processing home page 
        case "processing-home":
            loadNavigation("processing");
            loadProcessingHomePage();
            break;
        // Requests assigned to the user for processing
        case "assigned-requests":
            loadNavigation("processing");
            console.log("Load page: ", page);
            loadMyAssignedRequests(2, 2);
            break;

        // Load a specific request 
        case "process-request":
            loadNavigation("processing");
            loadProcessRequestPage(requestId, 2);
            break;

        // Temporary to allow for testing and proof of concept 
        case "authorized-view":
            loadNavigation("authorized_staff");
            // loadAuthorizedHome(); 
            break;

        // Authorized staff page placeholders // 
        case "authorized-home":
            loadNavigation("authorized_staff");
            showPagePlaceholder(
                "Authorized Staff Home",
                "Navigation and overview for authorized HR functions."
            );
            break;

        // UC-2: New requests awaiting review and classification.
        // Request queue implementation is pending.
        case "new-requests":
            loadNavigation("authorized_staff");
            showPagePlaceholder(
                "New Requests",
                "Incoming requests awaiting review and classification (UC-2)."
            );
            break;
        // All new and unreviewed/unassigned requests
        case "unassigned-requests":
            loadNavigation("authorized_staff");
            loadUnassignedRequests(2, confirmation);
            break;
        // UC-3: Assign and prioritize a selected HR request.
        case "assign-request":
            loadNavigation("authorized_staff");
            loadAssignRequestPage(requestId, actingEmployeeId);
            break;
        // open a new unreviewed request 
        case "new-request":
            loadNavigation("authorized_staff");
            loadNewRequestPage(requestId, 2);
            break;
        // Temporary to allow the user to get back to the processing view for testing
        case "processing-view":
            loadNavigation("processing");
            loadProcessingHomePage();
            break;


        case "confidential":
            loadNavigation("authorized_staff");
            showPagePlaceholder(
                "Confidential Requests",
                "Review and manage confidential requests within authorized permissions."
            );
            break;

        case "all-active-requests":
            loadNavigation("authorized_staff");
            showPagePlaceholder(
                "All Active Requests",
                "View and manage active HR requests across the system."
            );
            break;

        //=============================//
        // Employee page placeholders // 
        case "employee-home":
            loadNavigation("employee");
            // loadEmployeeHome(data.employeeId); 
            showPagePlaceholder(
                "Employee Portal",
                "Access employee HR services and requests."
            );
            break;
        case "my-requests":
            loadNavigation("employee");
            // loadMyRequestsPage(data.employeeId); 
            showPagePlaceholder(
                "My Requests",
                "Track submitted HR requests and their progress."
            );
            break;
        case "view-request":
            loadNavigation("employee");
            // loadViewRequestPage(data.employeeId); 
            break;
        case "employee-history":
            loadNavigation("employee");
            // loadEmployeeHistoryPage(data.employeeId); 
            showPagePlaceholder(
                "Employee History",
                "Review available employee history information."
            );

            break;
        //===============//
        //]Manager Pages//
        case "manager-home":
            loadNavigation("manager");
            // loadManagerHomePage(); 
            showPagePlaceholder(
                "Management Home",
                "Access management functions and request approvals."
            );
            break;
        case "pending-approvals":
            loadNavigation("manager");
            // loadPendingApprovalPage(); 
            showPagePlaceholder(
                "Pending Approval Requests",
                "Review HR requests awaiting management approval."
            );
            break;
        case "approval-request":
            loadNavigation("manager");
            // loadApprovalRequestPage(data.approvalId); 
            break;

        case "my-team":
            loadNavigation("manager");
            showPagePlaceholder(
                "My Team",
                "Team management functionality is pending implementation."
            );
            break;

        //===============//
        // Shared by all//
        // placeholder for the new request form
        case "submit-request":
            showPagePlaceholder(
                "Submit New Request",
                "Request submission functionality is pending implementation."
            );
            break;

        // Default page not found
        default:
            contentArea.innerHTML = '<h1>Page not found</h1>';
            break;

    } // End of switch statement

} // End of loadPage function

