const User = require('../models/User.js');

const getUserById = async (req, res) => {
  const { id } = req.params; 
  try {
    const user = await User.findByPk(id); 

    if (!user) {
      return res.status(404).json({ message: 'User not found' }); 
    }

    res.json(user); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' }); 
  }
};

module.exports = { getUserById };
