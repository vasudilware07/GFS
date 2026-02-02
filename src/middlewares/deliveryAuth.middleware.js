const jwt = require("jsonwebtoken");
const { DeliveryPerson } = require("../models");
const config = require("../config/env");

/**
 * Middleware to protect delivery person routes
 */
exports.protectDeliveryPerson = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login."
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Check if it's a delivery person token
    if (decoded.role !== "DELIVERY_PERSON") {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Delivery person access only."
      });
    }

    // Get delivery person
    const deliveryPerson = await DeliveryPerson.findById(decoded.id).select("-password");

    if (!deliveryPerson) {
      return res.status(401).json({
        success: false,
        message: "Delivery person not found"
      });
    }

    if (!deliveryPerson.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact admin."
      });
    }

    req.deliveryPerson = deliveryPerson;
    next();

  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again."
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
