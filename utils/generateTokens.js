const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('./ApiError');

const generateAccessToken = (user) => {

    console.log(ACCESS_TOKEN_SECRET,ACCESS_TOKEN_EXPIRY)
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};


const generateRefreshToken = (user) => {
  return jwt.sign(
    {
        id: user.id,
        role: user.role,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_SECRET }
  );
};


const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ fields: ['refreshToken'] });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Error generating access and refresh tokens');
  }
};

module.exports = { generateAccessAndRefereshTokens, generateAccessToken, generateRefreshToken };
