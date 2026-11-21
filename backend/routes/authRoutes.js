const express = require("express");
const authService = require("../services/authService");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

// Authenticate one of the seeded employee accounts.
router.post("/login", async (req, res, next) => {
    try {
        const employee = await authService.login(req.body?.email, req.body?.password);
        if (!employee) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Create a fresh session after successful login.
        req.session.regenerate(error => {
            if (error) return next(error);
            req.session.employeeId = employee.employeeId;
            req.session.save(error => {
                if (error) return next(error);
                return res.json({ success: true, data: employee });
            });
        });
    } catch (error) {
        return next(error);
    }
});

// Provides the frontend with the signed-in employee and permitted workspaces.
router.get("/me", requireAuth, async (req, res, next) => {
    try {
        const employee = await authService.getCurrentEmployee(req.auth.employeeId);
        return res.json({ success: true, data: employee });
    } catch (error) {
        return next(error);
    }
});

router.post("/logout", (req, res, next) => {
    if (!req.session) return res.json({ success: true });

    req.session.destroy(error => {
        if (error) return next(error);
        res.clearCookie("athr.sid", { path: "/" });
        return res.json({ success: true, message: "Signed out." });
    });
});

module.exports = router;