const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authController = require("../controllers/auth.controller");
const { protect } = require("../middlewares");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Google OAuth routes
router.get("/google", passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false
}));

router.get("/google/callback", 
  passport.authenticate("google", { 
    session: false, 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed` 
  }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
    
    // Redirect to frontend with token
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/auth/google/callback?token=${token}`);
  }
);

// Protected routes
router.get("/me", protect, authController.getMe);
router.put("/me", protect, authController.updateProfile);
router.put("/change-password", protect, authController.changePassword);

module.exports = router;
