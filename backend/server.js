const express = require("express");
const path = require("path");

const requestRoutes =
    require("./routes/requestRoutes");

const employeeRoutes =
    require("./routes/employeeRoutes");

const { testConnection } =
    require("./config/database");


const app = express();

const PORT =
    process.env.PORT || 3000;


app.use(express.json());


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


app.use(
    "/api/requests",
    requestRoutes
);


app.use(
    "/api/employees",
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