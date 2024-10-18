const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        const userRole = req.user.role;

        if (!roles.length || roles.includes(userRole)) {
            next();
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }
    };
};

module.exports = authorize;