const express = require('express');
const { register } = require('../controllers/authControllers.js');

const jwt = require('jsonwebtoken'); 
const { sendVerificationEmail } = require('../utils/email.js');
const nodemailer = require('nodemailer');
const { sendResetEmail, resetPassword , getUserProfile, updateUserProfile } = require('../controllers/authControllers.js');

const { getUserById } = require('../controllers/usersController.js');

const authenticateToken = require('../middleware/authenticationMiddleware.js');

const authorize = require('../middleware/authorize.js');

const bcrypt = require('bcryptjs');
const User = require('../models/User.js');
const router = express.Router();

router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body; // Assume the role is passed from the client

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the new user
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'user', // Default to 'user' if no role is provided
            isVerified: false // Email verification pending
        });
        const verificationToken = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        res.json({
            message: 'User registered successfully. Please verify your email.',
            user: {
                id: newUser.id,
                role: newUser.role,
                isVerified: newUser.isVerified,
                name: newUser.name,
                email: newUser.email,
            }
        });


        // Send email verification, etc.
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Check if the user is verified
        if (!user.isVerified) {
            return res.status(400).json({ message: 'Please verify your email to login.' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Login successful', token , role: user.role});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

  

router.post('/reset-password', sendResetEmail);

router.post('/reset-password/:token', resetPassword);



router.get('/profile', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, updateUserProfile);
router.get('/admin', authenticateToken, authorize('admin'), (req, res) => {
    res.json({ message: 'Welcome Admin' });
});

router.get('/users', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role'], // Specify the attributes you want to return
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// In your auth routes file (e.g., auth.js)

// Route to update user details
router.put('/users/:id', authenticateToken, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    const { name, email, role } = req.body; // Extract fields from request body

    if (role && !['admin', 'user'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Only update fields that are provided in the request body
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;

        await user.save(); // Save changes to the database

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Route to delete a user
router.delete('/users/:id', authenticateToken, authorize('admin'), async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/users/:id', authenticateToken, authorize('admin'), getUserById);


module.exports = router;
