const roleMiddleware = (allowedRoles) => {
    const normalizedAllowedRoles = allowedRoles.map((role) => String(role).toLowerCase());

    return (req, res, next) => {
        const userRole = String(req.user?.role || "").toLowerCase();

        if (!normalizedAllowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Insufficient permissions"
            });
        }

        next();
    };
};

module.exports = roleMiddleware;
