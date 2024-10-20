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
const { sendVerificationEmail } = require("../utils/email.js");

const {
  registerValidator,
  sendResetEmailValidator,
  resetPasswordValidator,
  updateMyProfileValidator,
  verifyEmailValidator,
  loginValidator,
  updateUserProfileValidator,
  deleteUserValidator,
  validateHandler,
} = require("../utils/validator.js");

const router = express.Router();

router.post(
  "/register",
  upload.single("photo"),
  registerValidator,
  validateHandler,
  register
);

router.get(
  "/verify-email",
  verifyEmailValidator,
  validateHandler,
  verifyEmail
);

router.post(
  "/verification-link",
  sendResetEmailValidator, 
  validateHandler,
  sendVerificationEmail
);

router.post(
  "/login",
  loginValidator,
  validateHandler,
  login
);

router.post(
  "/reset-password",
  sendResetEmailValidator,
  validateHandler,
  sendResetEmail
);

router.post(
  "/reset-password/:token",
  resetPasswordValidator,
  validateHandler,
  resetPassword
);

router.get(
  "/profile",
  authenticateToken,
  getUserProfile
);

router.put(
  "/profile",
  authenticateToken,
  upload.single("photo"),
  updateMyProfileValidator,
  validateHandler,
  updateMyProfile
);

router.get(
  "/users",
  authenticateToken,
  getUsers
);

router.put(
  "/users/:id",
  authenticateToken,
  authorize("admin"),
  upload.single("photo"),
  updateUserProfileValidator,
  validateHandler,
  updateUserProfile
);

router.delete(
  "/users/:id",
  authenticateToken,
  authorize("admin"),
  deleteUserValidator,
  validateHandler,
  deleteUser
);

router.get(
  "/users/:id",
  authenticateToken,
  getUserById
);

module.exports = router;
