// ============================================================
// AUTHENTICATION STATE
// ============================================================
//
// Maintains the currently authenticated employee and their
// available workspaces throughout the frontend application.
//
// Authentication is verified by the backend.
// This module only maintains the employee information returned
// by the authentication API.
//
// ============================================================

// ===============================
// CURRENT AUTHENTICATION STATE 
// ===============================

let currentEmployee = null; 
let availableWorkspaces = []; 

// ============================================================
// SET AUTHENTICATION STATE
// ============================================================
//
// Called after successfully retrieving the authenticated
// employee through GET /api/auth/me.
//
// ============================================================

export function setAuthState(authResponse) { 

    const employeeData = authResponse?.data; 

    if ( 
        !authResponse?.success ||
        !employeeData || 
        !Array.isArray(employeeData.workspaces)
    ) { 
        throw new Error("Invalid authentication data."); 
    }

    currentEmployee = employeeData; 

    availableWorkspaces = [...employeeData.workspaces]; 
}

// ==============================
// GET CURRENT EMPLOYEE 
// ==============================

export function getCurrentEmployeeState() { 
    return currentEmployee; 
}

// =====================================
// GET AVAILABLE WORKSPACES
// =====================================
export function getAvailableWorkspaces() { 
    return [...availableWorkspaces]; 
}

// ====================================
// CHECK AUTHENTICATION STATUS 
// ====================================   
export function isAuthenticated() { 
    return currentEmployee !== null; 
}
// ============================================================
// CLEAR AUTHENTICATION STATE
// ============================================================
// Called when an employee logs out or their session expires
// ============================================================
export function clearAuthState() {
    currentEmployee = null; 
    availableWorkspaces = null; 
} 

