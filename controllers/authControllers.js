const bcrypt = require('bcryptjs');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken'); 

exports.register = async (req, res) => {
  const { email, password, profileImage } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      email,
      password: hashedPassword,
      profileImage,
    });


    res.status(201).json({ message: 'User registered. Please verify your email.' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};


exports.sendResetEmail = async (req, res) => {
  const { email } = req.body;

  try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Generate reset token (you may want to set an expiration time)
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      // Send email logic here (using Nodemailer)
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });

      const resetLink = `http://localhost:5000/api/auth/reset-password/${token}`;
      await transporter.sendMail({
          to: email,
          subject: 'Password Reset Request',
          html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
      });

      return res.status(200).json({ message: 'Reset email sent' });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error sending reset email' });
  }
};

// Function to reset password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Hash the new password and update it
      user.password = newPassword; // Ensure you hash this before saving
      await user.save();

      return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error resetting password' });
  }
};


exports.getUserProfile = async (req, res) => {
    try {
        // Get user ID from JWT token (you should have a middleware to authenticate)
        const userId = req.user.id; // Assuming you have middleware that adds user to req

        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'role', 'isVerified'], // Select fields to return
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error fetching user profile' });
    }
};

exports.updateUserProfile = async (req, res) => {
    const { name, email, password } = req.body; // Get fields from request body

    try {
        const userId = req.user.id;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user fields
        user.name = name || user.name;
        user.email = email || user.email;

        // Update password if provided
        if (password) {
            user.password = await bcrypt.hash(password, 10); // Hash the new password
        }

        await user.save(); // Save the updated user

        return res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating profile' });
    }
};
