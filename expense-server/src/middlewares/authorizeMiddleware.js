const permissions = require("../utility/permission");

const authorizeMiddleware = (requiredPermission) => {
  return (request, response, next) => {
    // Auth middleware must run before this
    // so request.user is available
    const user = request.user;

    if (!user) {
      return response.status(401).json({
        message: "Unauthorized access",
      });
    }

    const userPermissions = permissions[user.role] || [];

    if (!userPermissions.includes(requiredPermission)) {
      return response.status(403).json({
        message: "Forbidden: Insufficient Permissions",
      });
    }

    next();
  };
};

module.exports = authorizeMiddleware;
