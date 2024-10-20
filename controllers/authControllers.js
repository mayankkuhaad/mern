const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const { Readable } = require('stream');
const { sendVerificationEmail } = require('../utils/email.js');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;
const redisClient = require('../utils/connectToRedis.js');
const User = require('../models/User.js');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const uploadBufferToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
  
      Readable.from(buffer).pipe(stream);
    });
  };
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const file = req.file; 
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let cloudinaryResult = null;
    if (file) {
      cloudinaryResult = await uploadBufferToCloudinary(file.buffer, 'user_photos');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      isVerified: false,
      photoUrl: cloudinaryResult?.secure_url || null,
      photoPublicId: cloudinaryResult?.public_id || null,
    });

    const verificationToken = jwt.sign(
      { id: newUser.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await sendVerificationEmail(email, verificationToken);
    await redisClient.del('allUsers');

    res.json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      user: {
        id: newUser.id,
        role: newUser.role,
        isVerified: newUser.isVerified,
        name: newUser.name,
        email: newUser.email,
        photoUrl: cloudinaryResult?.secure_url,
        photoPublicId: cloudinaryResult?.public_id,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.sendResetEmail = async (req, res) => {
  const { email } = req.body;

  try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });

      const resetLink = `http://localhost:3000/reset-password/${token}`;
      await transporter.sendMail({
          to: email,
          subject: 'Password Reset Request',
          html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
      });

      return res.status(200).json({success: true,message: 'Reset email sent' });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error sending reset email' });
  }
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      user.password = hashedPassword;
      await user.save();
  
      return res.status(200).json({ success: true,message: 'Password reset successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error resetting password' });
    }
  };

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id; 

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({success: true,user});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error fetching user profile' });
    }
};

exports.updateMyProfile = async (req, res) => {
  const { name, email, password } = req.body;
  const file = req.file;
  try {
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      let cloudinaryResult = null;
      if (file) {
          

          cloudinaryResult = await uploadBufferToCloudinary(file.buffer, 'user_photos');
          user.photoUrl = cloudinaryResult?.secure_url;
          user.photoPublicId = cloudinaryResult?.public_id;
          
      }

      user.name = name || user.name;
      user.email = email || user.email;

      if (password) {
          user.password = await bcrypt.hash(password, 10);
      }
     await user.save();
     await redisClient.del('allUsers');

      return res.status(200).json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error updating profile' });
  }
};

exports.verifyEmail =  async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({success:true, message: 'Email verified successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.login =async (req, res) => {
  const { email, password } = req.body;

  try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
          return res.status(400).json({ message: 'Invalid email or password.' });
      }

      if (!user.isVerified) {
          return res.status(400).json({ message: 'Please verify your email to login.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
          return res.status(400).json({ message: 'Invalid email or password.' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.json({ success: true, message: 'Login successful', token ,user : user});
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
}

exports.getUsers = async (req, res) => {
  try {
    const cachedUsers = await redisClient.get('allUsers');
    if (cachedUsers) {
        return res.status(200).json({
            success: true,
            message: "users fetched from cache!",
            users: JSON.parse(cachedUsers),
        });
    }
      const users = await User.findAll();
      await redisClient.setEx('allUsers', 3600, JSON.stringify(users));
      res.json(users);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
}

exports.updateUserProfile =  async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  const file = req.file;

  if (role && !['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
  }

  try {
      const user = await User.findByPk(id);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      if (name) user.name = name;
      if (email) user.email = email;
      if (role) user.role = role;

      if (file) {
          if (user.photoPublicId) {
              await cloudinary.uploader.destroy(user.photoPublicId);
          }

          const cloudinaryResult = await uploadBufferToCloudinary(file.buffer, 'user_photos');
          user.photoUrl = cloudinaryResult.secure_url;
          user.photoPublicId = cloudinaryResult.public_id;
      }

      await user.save();
      await redisClient.del('allUsers');

      res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
}

exports.deleteUser =  async (req, res) => {
  const { id } = req.params;

  try {
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      await user.destroy();
     await redisClient.del('allUsers');

      res.json({success: true, message: 'User deleted successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
}
