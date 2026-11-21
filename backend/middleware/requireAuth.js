const authService = require("../services/authService");

async function requireAuth(req, res, next) {
    const employeeId = req.session?.employeeId;

    if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
        return res.status(401).json({
            success: false,
            message: "Sign-in is required."
        });
    }

    try {
        const employee = await authService.getCurrentEmployee(employeeId);
        if (!employee) {
            return req.session.destroy(() => res.status(401).json({
                success: false,
                message: "Sign-in is required."
            }));
        }
        req.auth = { employeeId: employee.employeeId, workspaces: employee.workspaces };
        return next();
    } catch (error) {
        return next(error);
    }
}

function requireAuthorizedStaff(req, res, next) {
    if (!req.auth?.workspaces.includes("authorized_staff")) {
        return res.status(403).json({
            success: false,
            message: "Authorized HR staff access is required."
        });
    }
    return next();
}

module.exports = { requireAuth, requireAuthorizedStaff };