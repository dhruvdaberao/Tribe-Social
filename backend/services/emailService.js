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
        subject: "🔐 Tribe Social OTP Code",
        htmlContent: `
          <div style="font-family: 'Segoe UI', Arial; background-color: #1f1a17; padding: 30px; color: #f5e6d8; text-align: center;">
            <div style="max-width: 400px; margin: auto; background: #2a221d; padding: 25px; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.4);">
              <h2 style="margin-bottom: 10px;">🐾 Tribe Social</h2>
              <p style="color:#c9b6a3;">Use the OTP below to log in to your account.</p>
              <div style="font-size: 32px; letter-spacing: 8px; margin: 20px 0; font-weight: bold; color: #f0c7a1;">
                ${otp}
              </div>
              <p style="font-size: 14px; color:#bfa48a;">This code will expire in 5 minutes.</p>
              <hr style="border: none; border-top: 1px solid #3a2f28; margin: 20px 0;" />
              <p style="font-size: 13px; color:#a58c74;">
                Do not share this OTP with anyone.<br/>
                If you did not request this, you can safely ignore this email.
              </p>
              <p style="font-size: 13px; color:#a58c74;">
                After logging in, you can change your password from Account Settings.
              </p>
            </div>
          </div>
        `,
        textContent: `Your OTP is ${otp}\n\nDo not share this code.\nValid for 5 minutes.\n\nAfter login, change password in settings.`,
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
