const express = require('express');
const { register } = require('../controllers/authControllers.js');
const jwt = require('jsonwebtoken'); 
const { sendVerificationEmail } = require('../utils/email.js');
const nodemailer = require('nodemailer');
const { sendResetEmail, resetPassword , getUserProfile, updateUserProfile } = require('../controllers/authControllers.js');
const authenticateToken = require('../middleware/authenticationMiddleware.js');
const bcrypt = require('bcryptjs');
const User = require('../models/User.js');
const router = express.Router();

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
      });
  
      // Generate a verification token (you can use a library like crypto for more secure tokens)
      const verificationToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Send verification email
      await sendVerificationEmail(email, verificationToken);
  
      res.status(201).json({ message: 'User registered successfully, please check your email for verification link.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
  
      if (!user) {
        return res.status(400).json({ message: 'Invalid token' });
      }
  
      // Mark the user as verified
      user.isVerified = true;
      await user.save();
  
      res.status(200).json({ message: 'Email verified successfully!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  


router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Find the user by email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
  
      // Verify the password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
  
      // Generate JWT token
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Set the token to expire in 1 hour
      });
  
      res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

router.post('/reset-password', sendResetEmail);

router.post('/reset-password/:token', resetPassword);



router.get('/profile', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, updateUserProfile);


module.exports = router;
module.exports = router;
