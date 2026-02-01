const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect, adminOnly } = require("../middlewares");

// All routes require admin access
router.use(protect, adminOnly);

router.get("/with-dues", userController.getUsersWithDues);
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.put("/:id/block", userController.toggleBlockUser);
router.put("/:id/credit-limit", userController.updateCreditLimit);
router.delete("/:id", userController.deleteUser);

module.exports = router;
