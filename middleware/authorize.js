function authorize(requiredRole) {

    return (req, res, next) => {

        console.log("Role in JWT:", req.user.role);
        console.log("Required Role:", requiredRole);

        if (req.user.role !== requiredRole) {

            return res.status(403).json({

                message: "Access Denied"

            });

        }
        next();

    };
}

module.exports = authorize;