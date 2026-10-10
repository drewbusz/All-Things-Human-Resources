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


export function loadPage(page, requestId = null, actingEmployeeId = null) { 
    
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
            loadMyAssignedRequests(2); 
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

        // Authorized staff page placeholders // 
        case "authorized-home":
            loadNavigation("authorized_staff");
            break; 
        // All new and unreviewed/unassigned requests
        case "unassigned-requests":
            loadNavigation("authorized_staff");
            //loadUnassignedRequests(); 
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


