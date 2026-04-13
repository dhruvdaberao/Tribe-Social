import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from "axios";

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

export const sendOTPEmail = async (to, otp) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Tribe Social",
          email: "contact@brevo.com"
        },
        to: [{ email: to }],
        subject: "Tribe OTP Code",
        htmlContent: `
          <div style="text-align:center;font-family:Arial;">
            <h2>Password Reset</h2>
            <h1>${otp}</h1>
            <p>Valid for 5 minutes</p>
          </div>
        `
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Email sent:", response.data);
  } catch (error) {
    console.error("❌ Email error:", error.response?.data || error.message);
    throw new Error("Email sending failed");
  }
};

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const toArray = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];
    
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Tribe Social",
          email: "contact@brevo.com" 
        },
        to: toArray,
        subject: subject,
        htmlContent: html || text,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("✅ Generic email sent:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Generic email error:", error.response?.data || error.message);
    throw new Error("Generic email sending failed");
  }
};
