
const { pool } = require("../config/database");
const employeeService = require("./employeeService");
const requestRepository = require("../repositories/requestRepository");
const {
    canAccessRequest,
    hasConfidentialPermission
} = require("../utils/requestPermissions");

function serviceError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function validId(value) {
    return Number.isSafeInteger(Number(value)) && Number(value) > 0 &&
        value !== null && value !== undefined && value !== "";
}

async function canApprove(employeeId, connection = pool) {
    const authorizations = await employeeService.getEmployeeAuthorizations(
        employeeId,
        connection
    );
    return authorizations.some(auth => Boolean(auth.can_approve));
}

// The request processor must be authorized, not just logged in.
async function requireProcessor(request, employeeId, connection) {
    const authorizations = await employeeService.getEmployeeAuthorizations(
        employeeId,
        connection
    );
    if (!canAccessRequest(authorizations, request, employeeId, "process")) {
        throw serviceError("You cannot process this request.", "REQUEST_ACCESS_DENIED");
    }

    if (request.confidentiality_level === "Highly Confidential") {
        const permissions = await requestRepository.getRequestAuthorizations(
            request.request_id,
            employeeId,
            connection
        );
        if (!hasConfidentialPermission(permissions, "process")) {
            throw serviceError("Request authorization is required.", "REQUEST_ACCESS_DENIED");
        }
    }
}

async function saveHistory(connection, requestId, employeeId, field, before, after) {
    await connection.execute(`
        INSERT INTO request_history (
            request_id, created_by_emp_id, modified_field,
            previous_value, current_value, type
        ) VALUES (?, ?, ?, ?, ?, 'updated')
    `, [requestId, employeeId, field, String(before ?? ""), String(after ?? "")]);
}

async function setStep(connection, request, actorId, nextStepId) {
    await connection.execute(
        "UPDATE request SET current_step_id = ? WHERE request_id = ?",
        [nextStepId, request.request_id]
    );
    await saveHistory(
        connection, request.request_id, actorId, "current_step_id",
        request.current_step_id, nextStepId
    );
}

async function getStep(connection, requestTypeId, stepCode) {
    const [rows] = await connection.execute(`
        SELECT workflow_step_id, step_num, step_code
        FROM workflow_step
        WHERE request_type_id = ? AND step_code = ? AND is_active = TRUE
        ORDER BY step_num ASC LIMIT 1
    `, [requestTypeId, stepCode]);
    return rows[0] || null;
}

async function getLockedRequest(connection, requestId) {
    const [rows] = await connection.execute(`
        SELECT r.*, rt.approval_required, ws.step_code, ws.step_num,
               e.manager_id AS requester_manager_id
        FROM request r
        JOIN request_type rt ON rt.request_type_id = r.request_type_id
        JOIN workflow_step ws ON ws.workflow_step_id = r.current_step_id
        JOIN employee e ON e.employee_id = r.employee_id
        WHERE r.request_id = ?
        FOR UPDATE
    `, [requestId]);
    if (!rows.length) {
        throw serviceError("The request was not found.", "REQUEST_NOT_FOUND");
    }
    return rows[0];
}

async function inTransaction(action) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await action(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// HR prepares the approval. This is the only way to enter Manager Approval.
async function prepareApproval(requestId, employeeId, summary) {
    if (!validId(requestId)) {
        throw serviceError("A valid request ID is required.", "INVALID_REQUEST_ID");
    }
    if (summary !== undefined &&
        (typeof summary !== "string" || !summary.trim() || summary.length > 2000)) {
        throw serviceError("Enter a summary of up to 2000 characters.", "INVALID_APPROVAL_DATA");
    }

    return inTransaction(async connection => {
        const request = await getLockedRequest(connection, Number(requestId));
        await requireProcessor(request, employeeId, connection);

        if (!request.approval_required) {
            throw serviceError("This request type does not need approval.", "APPROVAL_NOT_REQUIRED");
        }
        if (request.step_code !== "hr_process" || request.assigned_emp_id === null) {
            throw serviceError("The request must be assigned and in HR Processing.", "APPROVAL_WRONG_STEP");
        }
        // UC-7 will handle assigning managers access to Highly Confidential requests.
        if (request.confidentiality_level === "Highly Confidential") {
            throw serviceError("Highly Confidential approvals require the UC-7 access workflow.", "APPROVAL_WRONG_STEP");
        }

        const managerId = Number(request.requester_manager_id);
        if (!validId(managerId) || managerId === Number(request.employee_id)) {
            throw serviceError("The requesting employee needs a configured manager.", "MANAGER_NOT_CONFIGURED");
        }
        const [managers] = await connection.execute(
            "SELECT employee_id FROM employee WHERE employee_id = ? AND status = 'active'",
            [managerId]
        );
        if (!managers.length || !(await canApprove(managerId, connection))) {
            throw serviceError("The employee's manager does not have approval permission.", "MANAGER_NOT_AUTHORIZED");
        }

        const approvalStep = await getStep(connection, request.request_type_id, "approval");
        if (!approvalStep || Number(approvalStep.step_num) !== Number(request.step_num) + 1) {
            throw serviceError("The Manager Approval workflow step is not configured.", "APPROVAL_WRONG_STEP");
        }

        const [previous] = await connection.execute(
            "SELECT approval_id FROM approval WHERE request_id = ? LIMIT 1",
            [request.request_id]
        );
        if (previous.length) {
            throw serviceError("An approval already exists for this request.", "APPROVAL_ALREADY_EXISTS");
        }

        const approvalSummary = summary?.trim() || request.brief_summary;
        const [inserted] = await connection.execute(`
            INSERT INTO approval (request_id, approving_emp_id, summary, decision)
            VALUES (?, ?, ?, NULL)
        `, [request.request_id, managerId, approvalSummary]);

        await setStep(connection, request, employeeId, approvalStep.workflow_step_id);
        await saveHistory(connection, request.request_id, employeeId,
            "approval_requested", "", "pending");

        return {
            approval_id: Number(inserted.insertId),
            request_id: Number(request.request_id),
            approving_emp_id: managerId,
            decision: null
        };
    });
}

// Managers see only approval requests addressed to their signed-in account.
async function getMyPendingApprovals(employeeId) {
    if (!(await canApprove(employeeId))) {
        throw serviceError("You do not have approval permission.", "REQUEST_ACCESS_DENIED");
    }
    const [rows] = await pool.execute(`
        SELECT a.approval_id, a.request_id, a.summary,
               a.submission_date, rv.request_type, rv.submitted_by,
               rv.priority_level, rv.status, rv.assigned_to
        FROM approval a
        JOIN request_view rv ON rv.request_id = a.request_id
        WHERE a.approving_emp_id = ? AND a.decision IS NULL
          AND rv.status_code = 'approval'
          AND rv.confidentiality_level <> 'Highly Confidential'
        ORDER BY a.submission_date ASC, a.approval_id ASC
    `, [employeeId]);
    return rows;
}

// Managers receive read-only request details through the approval endpoint.
// This does not grant them access to the regular HR request endpoints.
async function getRequestApproval(requestId, employeeId) {
    if (!validId(requestId)) {
        throw serviceError("A valid request ID is required.", "INVALID_REQUEST_ID");
    }
    const [rows] = await pool.execute(`
        SELECT a.approval_id, a.request_id, a.approving_emp_id,
               a.summary, a.submission_date, a.decision, a.decision_date,
               CONCAT(manager.first_name, ' ', manager.last_name) AS approved_by,
               rv.request_type, rv.request_type_id, rv.submitted_by, rv.status,
               rv.confidentiality_level, rv.employee_id, rv.assigned_emp_id,
               rv.brief_summary, rv.priority_level,
               rv.submission_date AS request_submission_date
        FROM approval a
        JOIN request_view rv ON rv.request_id = a.request_id
        JOIN employee manager ON manager.employee_id = a.approving_emp_id
        WHERE a.request_id = ?
        ORDER BY a.approval_id DESC LIMIT 1
    `, [Number(requestId)]);
    if (!rows.length) {
        throw serviceError("No approval has been requested.", "APPROVAL_NOT_FOUND");
    }
    const approval = rows[0];
    const authorizations = await employeeService.getEmployeeAuthorizations(employeeId);
    const managerAccess = Number(approval.approving_emp_id) === employeeId &&
        authorizations.some(auth => Boolean(auth.can_approve));
    const requestAccess = canAccessRequest(authorizations, approval, employeeId, "read");

    if (!managerAccess && !requestAccess) {
        throw serviceError("You cannot view this approval.", "REQUEST_ACCESS_DENIED");
    }
    if (approval.confidentiality_level === "Highly Confidential" &&
        Number(approval.employee_id) !== employeeId) {
        const permissions = await requestRepository.getRequestAuthorizations(
            Number(requestId), employeeId
        );
        if (!hasConfidentialPermission(permissions, "read")) {
            throw serviceError("Request authorization is required.", "REQUEST_ACCESS_DENIED");
        }
    }

    // Load values only after checking this employee's approval access.
    const [fields] = await pool.execute(`
        SELECT f.field_id, f.request_type_id, f.field_name,
               f.field_label, f.field_type, f.is_required, f.display_order,
               v.field_val
        FROM request_type_field f
        LEFT JOIN request_field_value v
            ON v.field_id = f.field_id AND v.request_id = ?
        WHERE f.request_type_id = ?
        ORDER BY f.display_order, f.field_id
    `, [Number(requestId), Number(approval.request_type_id)]);

    return {
        ...approval,
        request: {
            request_id: Number(approval.request_id),
            request_type_id: Number(approval.request_type_id),
            request_type: approval.request_type,
            submitted_by: approval.submitted_by,
            submission_date: approval.request_submission_date,
            priority_level: approval.priority_level,
            brief_summary: approval.brief_summary,
            status: approval.status,
            confidentiality_level: approval.confidentiality_level
        },
        typeFields: fields.map(({ field_val, ...definition }) => definition),
        fieldValues: fields.map(field => ({
            field_id: field.field_id,
            field_val: field.field_val
        }))
    };
}

// Manager decision also moves the request into HR's Review Approval step.
async function decideApproval(requestId, employeeId, decision) {
    if (!validId(requestId)) {
        throw serviceError("A valid request ID is required.", "INVALID_REQUEST_ID");
    }
    if (!["approved", "denied"].includes(decision)) {
        throw serviceError("Decision must be approved or denied.", "INVALID_APPROVAL_DECISION");
    }

    return inTransaction(async connection => {
        const request = await getLockedRequest(connection, Number(requestId));
        const [approvals] = await connection.execute(`
            SELECT approval_id, approving_emp_id, decision
            FROM approval WHERE request_id = ?
            ORDER BY approval_id DESC LIMIT 1 FOR UPDATE
        `, [request.request_id]);
        if (!approvals.length) {
            throw serviceError("No approval has been requested.", "APPROVAL_NOT_FOUND");
        }
        const approval = approvals[0];
        if (Number(approval.approving_emp_id) !== employeeId ||
            !(await canApprove(employeeId, connection))) {
            throw serviceError("You cannot decide this approval.", "REQUEST_ACCESS_DENIED");
        }
        if (approval.decision !== null || request.step_code !== "approval") {
            throw serviceError("This approval is no longer pending.", "APPROVAL_ALREADY_DECIDED");
        }
        if (request.confidentiality_level === "Highly Confidential") {
            const permissions = await requestRepository.getRequestAuthorizations(
                request.request_id, employeeId, connection
            );
            if (!hasConfidentialPermission(permissions, "read")) {
                throw serviceError("Request authorization is required.", "REQUEST_ACCESS_DENIED");
            }
        }
        const reviewStep = await getStep(connection, request.request_type_id, "review_approval");
        if (!reviewStep || Number(reviewStep.step_num) !== Number(request.step_num) + 1) {
            throw serviceError("The Review Approval step is not configured.", "APPROVAL_WRONG_STEP");
        }

        await connection.execute(`
            UPDATE approval SET decision = ?, decision_date = CURRENT_TIMESTAMP
            WHERE approval_id = ?
        `, [decision, approval.approval_id]);
        await setStep(connection, request, employeeId, reviewStep.workflow_step_id);
        await saveHistory(connection, request.request_id, employeeId,
            "approval_decision", "pending", decision);
        return { request_id: Number(request.request_id), decision, status: "Review Approval" };
    });
}

// HR acknowledges the decision. Denials close; approvals continue normally.
async function reviewApproval(requestId, employeeId) {
    if (!validId(requestId)) {
        throw serviceError("A valid request ID is required.", "INVALID_REQUEST_ID");
    }
    return inTransaction(async connection => {
        const request = await getLockedRequest(connection, Number(requestId));
        await requireProcessor(request, employeeId, connection);
        if (request.step_code !== "review_approval") {
            throw serviceError("This request is not ready for HR approval review.", "APPROVAL_WRONG_STEP");
        }
        const [approvals] = await connection.execute(`
            SELECT approval_id, decision FROM approval WHERE request_id = ?
            ORDER BY approval_id DESC LIMIT 1 FOR UPDATE
        `, [request.request_id]);
        if (!approvals.length || !["approved", "denied"].includes(approvals[0].decision)) {
            throw serviceError("The manager has not decided this request.", "APPROVAL_PENDING");
        }
        const decision = approvals[0].decision;
        let nextStep;
        if (decision === "denied") {
            nextStep = await getStep(connection, request.request_type_id, "complete");
        } else {
            const [steps] = await connection.execute(`
                SELECT workflow_step_id, step_code FROM workflow_step
                WHERE request_type_id = ? AND is_active = TRUE AND step_num = ?
                LIMIT 1
            `, [request.request_type_id, Number(request.step_num) + 1]);
            nextStep = steps[0];
        }
        if (!nextStep) {
            throw serviceError("The next workflow step is not configured.", "APPROVAL_WRONG_STEP");
        }

        await setStep(connection, request, employeeId, nextStep.workflow_step_id);
        await saveHistory(connection, request.request_id, employeeId,
            "approval_review", decision, decision === "denied" ? "closed_denied" : "continued");
        return {
            request_id: Number(request.request_id),
            decision,
            status: decision === "denied" ? "Complete (denied)" : nextStep.step_code
        };
    });
}

// Normal PATCH /api/requests/:id must not bypass the approval actions.
async function checkProcessingTransition(request, currentStep, nextStep, connection) {
    const [types] = await connection.execute(
        "SELECT approval_required FROM request_type WHERE request_type_id = ?",
        [request.request_type_id]
    );
    if (!types[0]?.approval_required) return;

    if (currentStep.step_code === "hr_process" ||
        currentStep.step_code === "approval" ||
        currentStep.step_code === "review_approval" ||
        nextStep.step_code === "approval" ||
        nextStep.step_code === "review_approval") {
        throw serviceError(
            "Use the Manager Approval actions to change this status.",
            "INVALID_STATUS"
        );
    }

    if (nextStep.step_code === "complete") {
        const [approvals] = await connection.execute(`
            SELECT decision FROM approval WHERE request_id = ?
            ORDER BY approval_id DESC LIMIT 1
        `, [request.request_id]);
        if (approvals[0]?.decision !== "approved") {
            throw serviceError("Manager approval is required before completion.", "UPDATE_FAILED");
        }
    }
}

module.exports = {
    prepareApproval,
    getMyPendingApprovals,
    getRequestApproval,
    decideApproval,
    reviewApproval,
    checkProcessingTransition
};
