const jwt = require("jsonwebtoken");
const { User } = require("../models/user");

const userAuth = async (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(403).json({ message: "ACCESS_DENIED: No Token Provided" });
        }

        const decodedMSG = await jwt.verify(token, process.env.JWT_SECRET || "classROOM@system$123");

        const user = await User.findById(decodedMSG._id);

        if (!user) {
            return res.status(404).json({ message: "USER_NOT_FOUND" });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: "ERROR: Invalid or Expired Token" });
    }
};

const adminAuth = async (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "ACCESS_DENIED: Admins Only" });
    }
    next();
};

module.exports = { userAuth, adminAuth };
