// Shared permission checks for HR requests.

const MANAGEMENT_TYPES = [3, 5];
const HR_TYPES = [3, 5, 6];

function hasRole(authorizations, allowedTypes) {
    return authorizations.some(auth =>
        allowedTypes.includes(Number(auth.auth_type_id))
    );
}

// Authorized HR staff can read or update the management queues.
function canManageRequests(authorizations, operation = "read") {
    const field = operation === "update" ? "can_update" : "can_view";

    return authorizations.some(auth =>
        MANAGEMENT_TYPES.includes(Number(auth.auth_type_id)) &&
        Boolean(auth[field])
    );
}

// Preserve the existing role check on the unassigned queue.
function canViewUnassignedRequests(authorizations) {
    return hasRole(authorizations, MANAGEMENT_TYPES);
}

function canAccessRequest(authorizations, request, employeeId, operation) {
    const types = authorizations.map(auth => Number(auth.auth_type_id));
    const assigned = Number(request.assigned_emp_id) === Number(employeeId);
    const owner = Number(request.employee_id) === Number(employeeId);
    const generalHR = types.includes(3) || types.includes(5);
    const assignedHR = types.includes(6) && assigned;

    if (operation === "read") {
        return owner || generalHR || assignedHR;
    }

    if (operation === "process") {
        return types.includes(5) ||
            (assigned && hasRole(authorizations, HR_TYPES));
    }

    if (operation === "note") {
        return owner || generalHR || assignedHR;
    }

    return false;
}

// A Highly Confidential request also requires explicit request access.
function hasConfidentialPermission(permissions, operation) {
    const field = operation === "read" ? "can_view" : "can_update";
    return permissions.some(permission => Boolean(permission[field]));
}

module.exports = {
    canManageRequests,
    canViewUnassignedRequests,
    canAccessRequest,
    hasConfidentialPermission
};