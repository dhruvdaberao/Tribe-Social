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
          email: "contact.tribesocial@gmail.com"
        },
        to: [{ email: to }],
        subject: "Your OTP Code",
        htmlContent: `
          <div style="font-family: Arial; text-align: center;">
            <h2>Tribe Social</h2>
            <p>Your OTP Code:</p>
            <h1 style="letter-spacing: 5px;">${otp}</h1>
            <p>This code expires in 5 minutes.</p>
          </div>
        `,
        textContent: `Your OTP is ${otp}. Valid for 5 minutes.`,
        replyTo: {
          email: "contact.tribesocial@gmail.com",
          name: "Tribe Social"
        },
        headers: {
          "X-Mailin-custom": "otp-email"
        }
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Email response:", response.data);
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
          email: "contact.tribesocial@gmail.com" 
        },
        to: toArray,
        subject: subject,
        htmlContent: html || text,
        textContent: text || '',
        replyTo: {
          email: "contact.tribesocial@gmail.com",
          name: "Tribe Social"
        },
        headers: {
          "X-Mailin-custom": "generic-email"
        }
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
