const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendVerificationEmail = async (email, code) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
        <h1 style="color: #333; text-align: center;">Email Verification</h1>
        <p style="color: #555;">Hello,</p>
        <p style="color: #555;">Thank you for registering with us. Please use the verification code below to verify your email address:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; color: #fff; background-color: #4CAF50; padding: 10px 20px; border-radius: 5px;">${code}</span>
        </div>
        <p style="color: #555;">This code will expire in 10 minutes.</p>
        <p style="color: #555;">Best regards,<br/>The EditorsHub Team</p>
      </div>
    `
  });
};

exports.sendPasswordResetEmail = async (email, code) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
        <h1 style="color: #333; text-align: center;">Password Reset</h1>
        <p style="color: #555;">Hello,</p>
        <p style="color: #555;">We received a request to reset your password. Please use the code below to reset your password:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; color: #fff; background-color: #FF5722; padding: 10px 20px; border-radius: 5px;">${code}</span>
        </div>
        <p style="color: #555;">This code will expire in 10 minutes.</p>
        <p style="color: #555;">If you did not request a password reset, please ignore this email.</p>
        <p style="color: #555;">Best regards,<br/>The EditorsHub Team</p>
      </div>
    `
  });
};