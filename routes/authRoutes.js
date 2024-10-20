const express = require("express");
const {
  verifyEmail,
  getUsers,
  login,
  updateMyProfile,
  register,
  sendResetEmail,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  deleteUser,
} = require("../controllers/authControllers.js");
const { getUserById } = require("../controllers/usersController.js");
const authenticateToken = require("../middleware/authenticationMiddleware.js");
const authorize = require("../middleware/authorize.js");
const upload = require("../utils/multer.js");
const {sendVerificationEmail} = require("../utils/email.js")

const router = express.Router();

router.post("/register", upload.single("photo"), register);
router.get("/verify-email", verifyEmail);
router.post("/verification-link", sendVerificationEmail);

router.post("/login", login);


router.post("/reset-password", sendResetEmail);

router.post("/reset-password/:token", resetPassword);

router.get("/profile", authenticateToken, getUserProfile);
router.put(
  "/profile",
  authenticateToken,
  upload.single("photo"),
  updateMyProfile
);

router.get("/users", authenticateToken, getUsers);

router.put(
  "/users/:id",
  authenticateToken,
  authorize("admin"),
  upload.single("photo"),
  updateUserProfile
);

router.delete("/users/:id", authenticateToken, authorize("admin"), deleteUser);

router.get("/users/:id", authenticateToken, getUserById);

module.exports = router
