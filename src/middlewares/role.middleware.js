// Role-based access control middleware

// Restrict to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action"
      });
    }
    next();
  };
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Admin access required"
    });
  }
  next();
};

// User only middleware
exports.userOnly = (req, res, next) => {
  if (req.user.role !== "USER") {
    return res.status(403).json({
      success: false,
      message: "User access required"
    });
  }
  next();
};
