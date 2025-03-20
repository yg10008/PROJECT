const roleAuth = (requiredRole) => {
    return (req, res, next) => {
        if (req.user.role !== requiredRole) {
            return res.status(403).json({ message: "ACCESS_DENIED: Insufficient Permissions" });
        }
        next();
    };
};

module.exports = { roleAuth };
