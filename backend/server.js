const express = require("express");
const path = require("path");
const session = require("express-session");
require("dotenv").config();

const requestRoutes =
    require("./routes/requestRoutes");

const employeeRoutes =
    require("./routes/employeeRoutes");

const authRoutes = require("./routes/authRoutes");
const { requireAuth, requireAuthorizedStaff } =
    require("./middleware/requireAuth");

const { testConnection } =
    require("./config/database");


const app = express();

const PORT =
    process.env.PORT || 3000;


if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error("Set SESSION_SECRET in backend/.env (at least 32 characters).");
}

app.use(express.json());

// Sessions are kept in memory for the local class prototype.
app.use(session({
    name: "athr.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 4 * 60 * 60 * 1000
    }
}));


app.use(
    express.static(
        path.join(
            __dirname,
            "../frontend"
        )
    )
);


app.get(
    "/api/health",
    async (req, res) => {

        try {

            await testConnection();


            return res.status(200).json({
                success: true,
                message:
                    "All Things HR API is running and the database is reachable."
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                message:
                    "The API is running, but the database connection failed."
            });
        }
    }
);


// Login routes are public; request and employee routes require a session.
app.use("/api/auth", authRoutes);

app.use(
    "/api/requests",
    requireAuth,
    requestRoutes
);


app.use(
    "/api/employees",
    requireAuth,
    requireAuthorizedStaff,
    employeeRoutes
);


/*
 * Catch server errors
 */
app.use(
    (error, req, res, next) => {

        console.error(error);


        return res.status(500).json({
            success: false,
            message:
                "An unexpected server error occurred."
        });
    }
);


app.listen(
    PORT,
    () => {

        console.log(
            `All Things HR server running at http://localhost:${PORT}`
        );
    }
);