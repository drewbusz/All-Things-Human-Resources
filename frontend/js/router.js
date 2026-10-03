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



export function loadPage(page, data = {}) { 

    switch (page) {
        //====================
        // HR Staff Pages 
        // ===================
        // hr staff processing home page 
        case "processing-home": 
            loadNavigation("processing"); 
            // loadProcessingHomePage(); 
            break;
        // Requests assigned to the user for processing
        case "assigned-requests":
            loadNavigation("processing");
            // loadAssignedRequestsPage(); 
            break;
        case "new-requests": 
            loadNavigation("processing");
            // loadNewRequestsPage(); 
            break; 
        // Load a specific request 
        case "process-request":
            loadNavigation("processing");
            loadProcessRequestPage(data.requestId); 
            break; 

        //====================
        // Employee page placeholders
        // ===================
        // employee home placeholder
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

        //====================
        // Manager Pages
        //===================
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

        //====================
        // Shared by all
        //====================
        // placeholder for the new request form
        case "submit-request":

            break; 
        // Default page not found
        default:
            contentArea.innerHTML = '<h1>Page not found</h1>';
            break; 
    }
}

export default loadPage; 
