const bcrypt = require('bcryptjs');
const User = require('../models/User');
const nodemailer = require('nodemailer');

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
