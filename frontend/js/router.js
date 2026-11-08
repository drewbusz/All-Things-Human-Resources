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
import { loadSubmitRequestPage } from "./pages/submitRequestPage.js";
import { loadActiveRequests } from "./pages/activeRequestsPage.js"; 

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

export function loadPage(
    page,
    requestId = null,
    actingEmployeeId = null,
    confirmation = null
) {
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

        // Authorized staff page placeholders // 
        case "authorized-home":
            loadNavigation("authorized_staff");
            showPagePlaceholder(
                "Authorized Staff Home",
                "Navigation and overview for authorized HR functions."
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
        // AUTHORIZED HR STAFF VIEW OF ALL ACTIVE REQUESTS 
        case "active-requests":
            loadNavigation("authorized_staff");
            loadActiveRequests(actingEmployeeId);
            break; 
        case "confidential":
            loadNavigation("authorized_staff");
            showPagePlaceholder(
                "Confidential Requests",
                "Review and manage confidential requests within authorized permissions."
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

            // UC-1: Employee submits a new HR request.
        case "submit-request":
            loadNavigation("employee");
            loadSubmitRequestPage(7);
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
        

        // Default page not found
        default:
            contentArea.innerHTML = '<h1>Page not found</h1>';
            break;

    } // End of switch statement

} // End of loadPage function

