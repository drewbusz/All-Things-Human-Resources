const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const requestRoutes =
    require("./routes/requestRoutes");

const {
    testConnection
} = require("./config/database");


const app = express();


app.use(cors());

app.use(express.json());


app.use(
    express.static(
        path.join(__dirname, "../frontend")
    )
);


app.get("/api/health", async (req, res) => {

    try {

        await testConnection();


        return res.status(200).json({
            success: true,
            message:
                "All Things HR API is running and the database is reachable."
        });

    } catch (error) {

        console.error(
            "Database health check failed:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "API is running, but the database connection failed."
        });
    }
});


app.use(
    "/api/requests",
    requestRoutes
);


app.use((req, res) => {

    return res.status(404).json({
        success: false,
        message: "Resource not found."
    });
});


app.use((err, req, res, next) => {

    console.error(err);


    return res.status(500).json({
        success: false,
        message:
            "An unexpected server error occurred."
    });
});


const PORT =
    Number(process.env.PORT) || 3000;


app.listen(PORT, () => {

    console.log(
        `All Things HR server running at http://localhost:${PORT}`
    );
});