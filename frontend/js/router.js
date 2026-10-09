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
import { loadUnassignedRequestPage } from "./pages/unassignedRequestPage.js"; 



export function loadPage(page, requestId = null, actingEmployeeId = null) { 
    console.log("Loading page: " + page + " For Request ID: " + requestId); 
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
            // loadAssignedRequestsPage(); 
            break;
        
        // Load a specific request 
        case "process-request":
            loadNavigation("processing");
            loadProcessRequestPage(requestId, 2); 
            break; 

        // Authorized staff page placeholders // 
        case "authorized-home":
            loadNavigation("authorized-staff");
            break; 
        // All new and unreviewed/unassigned requests
        case "unassigned-requests":
            loadNavigation("authorized-staff");
            break;
        // open a new unreviewed request 
        case "new-request":
            loadNavigation("authorized-staff");
            loadNewRequestPage(requestId, 2);
            break; 

        //=============================//
        // Employee page placeholders // 
        case "employee-home": 
            loadNavigation("employee");
            // loadEmployeeHome(data.employeeId); 
            break; 
        case "my-requests":
            loadNavigation("employee"); 
            // loadMyRequestsPage(data.employeeId); 
            break; 
        case "view-request": 
            loadNavigation("employee"); 
            // loadViewRequestPage(data.employeeId); 
            break; 
        case "employee-history": 
            loadNavigation("employee"); 
            // loadEmployeeHistoryPage(data.employeeId); 
            break; 
        //===============//
        //]Manager Pages//
        case "manager-home":
            loadNavigation("manager");
            // loadManagerHomePage(); 
            break; 
        case "pending-approvals":
            loadNavigation("manager");
            // loadPendingApprovalPage(); 
            break; 
        case "approval-request":
            loadNavigation("manager");
            // loadApprovalRequestPage(data.approvalId); 
            break; 

        //===============//
        // Shared by all//
        // placeholder for the new request form
        case "submit-request":

            break; 
        // Default page not found
        default:
            contentArea.innerHTML = '<h1>Page not found</h1>';
            break; 
    }
}


