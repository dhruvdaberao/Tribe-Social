import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.resolve(__dirname, '../emails');

export const renderTemplate = async (templateName, replacements = {}) => {
  const templatePath = path.join(templatesDir, templateName);
  let html = await readFile(templatePath, 'utf-8');

  Object.entries(replacements).forEach(([key, value]) => {
    html = html.replaceAll(`{{${key}}}`, value ?? '');
  });

  return html;
};

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

export const sendOTPEmail = async (to, otp) => {
  try {
    console.log("Sending OTP to:", to);

    const info = await transporter.sendMail({
      from: `"Tribe Social" <${process.env.BREVO_USER}>`,
      to: to,
      subject: "Tribe OTP Code",
      html: `
        <div style="font-family: Arial; text-align: center;">
          <h2>Password Reset</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>This OTP expires in 5 minutes.</p>
        </div>
      `,
    });

    console.log("✅ Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Email error:", error);
    throw new Error("Email sending failed");
  }
};

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"Tribe Social" <${process.env.BREVO_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
    };
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("❌ Generic email error:", error);
    throw error;
  }
};
