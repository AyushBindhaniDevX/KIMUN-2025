import nodemailer from 'nodemailer';

// Configure transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASSWORD, // Your Gmail password or app password
  },
});

// Function to send email
export const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `MUN Team <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};