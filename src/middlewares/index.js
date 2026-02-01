const { protect, generateToken } = require("./auth.middleware");
const { restrictTo, adminOnly, userOnly } = require("./role.middleware");

module.exports = {
  protect,
  generateToken,
  restrictTo,
  adminOnly,
  userOnly
};
