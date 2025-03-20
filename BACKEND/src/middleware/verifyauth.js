const jwt = require("jsonwebtoken");

const verifyJWT = async (req, res, next) => {
    const token = req.cookies.token; // Assuming token is stored in cookies

    if (!token) {
        return res.status(401).json({ message: "UNAUTHORIZED: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user data to `req`
        next(); // Continue to `adminAuth`
    } catch (error) {
        return res.status(403).json({ message: "INVALID_TOKEN" });
    }
};
