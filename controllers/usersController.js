// controllers/userController.js

const User = require('../models/User.js'); // Import your User model

// Function to get user by ID
const getUserById = async (req, res) => {
  const { id } = req.params; // Get the user ID from the request parameters

  try {
    const user = await User.findByPk(id); // Fetch the user by ID

    if (!user) {
      return res.status(404).json({ message: 'User not found' }); // Handle not found
    }

    res.json(user); // Respond with the user data
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' }); // Handle server error
  }
};

module.exports = { getUserById };
