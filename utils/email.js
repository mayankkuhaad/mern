const nodemailer = require('nodemailer');

// Configure your email transport
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Use your email service provider
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

// Function to send verification email
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `http://localhost:3000/verify-email/${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification',
    html: `<p>Please verify your email by clicking the link: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
