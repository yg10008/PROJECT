

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/database");  

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());  

const institutionRoutes = require("./routes/institution");
const imageRoutes = require("./routes/imageraoutes");

app.use("/api/institutions", institutionRoutes);
app.use("/api/images", imageRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

connectDB()
    .then(() => {
        console.log("CONNECTION_TO_DATABASE_IS_SUCCESSFULLY_ESTABLISHED");
        app.listen(108, () => {
            console.log("SERVER_UP_108");
        });
    })
    .catch((err) => {
        console.error("ERROR_OCCURED_IN_DATABASE_CONNECTION : " + err);
    });
