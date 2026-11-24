// ==================================================
// router.js
// Controls front end page routing and page specializations
// based on user type (employee, HR staff, Manager)
// ==================================================

import { loadNavigation } from "./navigation.js";

// Authentication State
import { getCurrentEmployeeState, getAvailableWorkspaces, isAuthenticated } from "../auth/authState.js"; 

// importing specific pages 
import {
    loadProcessingHomePage, 
    loadAuthorizedHomePage,
    loadEmployeeHomePage,
    loadManagerHomePage
} from "./pages/homePages.js";

import { loadProcessRequestPage } from "./pages/processRequestPage.js";
import { loadIntakeRequestPage } from "./pages/intakeRequestPage.js";
import { loadMyAssignedRequests } from "./pages/myAssignedRequestsPage.js";
import { loadUnassignedRequests } from "./pages/unassignedRequestsPage.js";
import { loadAssignRequestPage } from "./pages/assignRequestPage.js";
import { loadSubmitRequestPage } from "./pages/submitRequestPage.js";
import { loadActiveRequests } from "./pages/activeRequestsPage.js"; 
import { loadPendingRequests } from "./pages/pendingRequestPage.js"; 
import { loadMyAssignedApprovals } from "./pages/myAssignedApprovalsPage.js"; 
import { loadManagerApprovalPage } from "./pages/managerApprovalPage.js";
import { loadMyRequestsPage } from "./pages/myRequestsPage.js";
import { loadViewRequestPage } from "./pages/viewRequestPage.js";

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

// Access Denied 
function showAccessDenied() { 
    const contentArea =
        document.getElementById("contentArea"); 

    contentArea.innerHTML = `
        <div class="card"> 
            <h2>Access Denied</h2>
            <hr>
            <p>
                You do not have access to this workspace or its requested page. 
            </p>
            </div>    
        `; 
}

// ============================================================
// PAGE WORKSPACE REQUIREMENTS
// ============================================================
// Associated each page with its required workspace.
// Workspace availability is determined by the backend
// and retrieved through authState.js
// ============================================================
const pageWorkspaces = {
    //  HR Processing 
    "processing-home": "processing",
    "assigned-requests": "processing",
    "process-request": "processing",

    // Authorized HR Staff
    "authorized-home": "authorized_staff",
    "new-requests": "authorized_staff",
    "unassigned-requests": "authorized_staff",
    "assign-request": "authorized_staff",
    "active-requests": "authorized_staff",
    "confidential": "authorized_staff",
    "request-intake": "authorized_staff",

    // Employee
    "employee-home": "employee",
    "my-requests": "employee",
    "view-request": "employee",
    "employee-history": "employee",
    "submit-request": "employee",

    // Manager
    "manager-home": "manager",
    "pending-approvals": "manager",
    "approval-request": "manager",
    "my-team": "manager"
}; 

// WORKSPACE NAVIGATION 
const workspaceHomePages = {
    processing: "processing-home",
    authorized_staff: "authorized-home",
    employee: "employee-home",
    manager: "manager-home"
}; 


export function loadPage(
    page,
    requestId = null,
    confirmation = null
) {
    const contentArea = document.getElementById("contentArea");
    
    // ------------------------------
    // Check authentication
    // ------------------------------------
    if (!isAuthenticated()) { 
        contentArea.innerHTML = ""; 
        showAccessDenied(); 
        return; 
    }

    // Retrieve the authenticated employee 
    const employee =
        getCurrentEmployeeState(); 

    // Retrieve available workspaces 
    const availableWorkspaces =
        getAvailableWorkspaces(); 

    // Verify workspace access
    const requiredWorkspace =
        pageWorkspaces[page]; 

    if (
        !requiredWorkspace || !availableWorkspaces.includes(requiredWorkspace)
    ) { 
        showAccessDenied(); 
        return; 
    }
    // Prepare page content
    contentArea.innerHTML = ""; 

    // Load navigation for the selected workspace 
    loadNavigation(requiredWorkspace); 

    switch (page) {
        // ==================================
        // HR PROCESSING PAGES
        // ==================================
        case "processing-home":
            loadProcessingHomePage();
            break;

        case "assigned-requests":
            loadMyAssignedRequests();
            break;

        case "process-request":
            loadProcessRequestPage(
                requestId,
                confirmation
            );
            break;

        // ==================================
        // AUTHORIZED STAFF PAGES
        // ==================================

        case "authorized-home":
            loadAuthorizedHomePage();
            break;

        case "new-requests":
            loadPendingRequests(
                confirmation
            );
            break;

        case "unassigned-requests":
            loadUnassignedRequests(
                confirmation
            );
            break;

        case "assign-request":
            loadAssignRequestPage(
                requestId,
                confirmation
            );
            break;

        case "active-requests":
            loadActiveRequests(
                confirmation
            );
            break;

        case "confidential":
            showPagePlaceholder(
                "Confidential Requests",
                "Review and manage confidential requests within authorized permissions."
            );
            break;

        case "request-intake":
            loadIntakeRequestPage(
                requestId,
            );
            break;

        // ==================================
        // EMPLOYEE PAGES
        // ==================================

        case "employee-home":
            loadEmployeeHomePage();
            break;

        case "my-requests":
            loadMyRequestsPage();
            break;

        case "view-request":
            loadViewRequestPage(requestId);
            break;

        case "employee-history":
            showPagePlaceholder(
                "Employee History",
                "Review available employee history information."
            );

            break;
        // UC-1: Employee submits a new HR request
        case "submit-request":
            loadSubmitRequestPage();
            break;


        // ==================================
        // MANAGER PAGES
        // ==================================

        case "manager-home":
            loadManagerHomePage();
            break;

        case "pending-approvals":
            loadMyAssignedApprovals(confirmation); 
            break;

        case "approval-request":
            loadManagerApprovalPage(requestId, confirmation); 
            break;

        case "my-team":
            showPagePlaceholder(
                "My Team",
                "Team management functionality is pending implementation."
            );
            break;


        // ==================================
        // DEFAULT
        // ==================================

        default:
            contentArea.innerHTML = `
                <h1>Page not found</h1>
            `;
            break;
        //===============//
    } // End of switch statement

} // End of loadPage function

