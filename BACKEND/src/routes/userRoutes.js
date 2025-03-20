const express = require("express");
const { validateSignUpData } = require("../utils/validation");
const { User } = require("../models/user");
const { userAuth, adminAuth } = require("../middleware/auth");
const bcrypt = require("bcrypt");

const authRouter = express.Router();

// SIGNUP ROUTE
authRouter.post("/signup", async (req, res) => {
    try {
        validateSignUpData(req);

        const { firstName, lastName, emailId, password, role } = req.body;

        const existingUser = await User.findOne({ emailId });
        if (existingUser) {
            return res.status(400).send("EMAIL_ALREADY_REGISTERED");
        }

        const user1 = new User({
            firstName,
            lastName,
            password,
            emailId,
            role: role || "user"
        });

        await user1.save();
        res.send("USER_REGISTERED_SUCCESSFULLY");
    } catch (err) {
        res.status(400).send("ERROR_OCCURED_IN_STORING : " + err.message);
    }
});

// LOGIN ROUTE
authRouter.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;

        const user = await User.findOne({ emailId });

        if (!user) {
            throw new Error("INVALID_CREDENTIALS");
        }

        const isPasswordValid = await user.getPasswordAuthentication(password);

        if (isPasswordValid) {
            const token = await user.getJWT();
            res.cookie("token", token, {
                expires: new Date(Date.now() + 8 * 3600000)
            });
            res.send("USER_LOGIN_SUCCESSFUL");
        } else {
            throw new Error("INVALID_CREDENTIALS");
        }
    } catch (err) {
        res.status(411).send("ERROR_OCCURED_IN_LOGIN : " + err.message);
    }
});

// LOGOUT ROUTE
authRouter.post("/logout", async (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now())
    });

    res.send("LOGGED_OUT_SUCCESSFULLY");
});

// ADMIN DASHBOARD ROUTE
authRouter.get("/admin-dashboard", adminAuth, (req, res) => {
    res.json({ message: "Welcome to the Admin Dashboard" });
});


module.exports = authRouter;
