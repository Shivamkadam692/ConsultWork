const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email
const sendEmail = async (to, subject, html, text = '') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send verification email
const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  const html = `
    <h2>Email Verification</h2>
    <p>Hello ${user.firstName},</p>
    <p>Thank you for registering. Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
  `;

  return await sendEmail(user.email, 'Verify Your Email', html);
};

// Send password reset email
const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const html = `
    <h2>Password Reset</h2>
    <p>Hello ${user.firstName},</p>
    <p>You requested to reset your password. Click the link below to reset it:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  return await sendEmail(user.email, 'Password Reset Request', html);
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (user, booking) => {
  const html = `
    <h2>Booking Confirmation</h2>
    <p>Hello ${user.firstName},</p>
    <p>Your booking request has been ${booking.status === 'accepted' ? 'accepted' : 'received'}.</p>
    <p><strong>Service:</strong> ${booking.serviceCategory}</p>
    <p><strong>Date:</strong> ${new Date(booking.requestedDate).toLocaleDateString()}</p>
    <p><strong>Time:</strong> ${booking.requestedTime}</p>
    <p>Thank you for using our service.</p>
  `;

  return await sendEmail(user.email, 'Booking Confirmation', html);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail
};

