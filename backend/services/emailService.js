import { Resend } from 'resend';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const resend = new Resend(process.env.RESEND_API_KEY);

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

export const sendEmail = async ({ to, subject, html, text }) => {
  // Use Nodemailer if SMTP credentials are provided (Bypasses Resend Sandbox limitations)
  if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `Tribe Social <${process.env.SMTP_EMAIL}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
    };

    return await transporter.sendMail(mailOptions);
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error('Neither SMTP_EMAIL/SMTP_PASSWORD nor RESEND_API_KEY are configured');
  }

  const fromAddress =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    'Tribe Social <onboarding@resend.dev>';

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  });

  if (error) {
    const message = error.message || 'Unknown Resend error';
    const sendError = new Error(message);
    sendError.name = 'EmailServiceError';
    sendError.cause = error;
    throw sendError;
  }

  return data;
};
