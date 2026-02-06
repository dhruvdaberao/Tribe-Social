import { Resend } from 'resend';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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
  if (!process.env.RESEND_API_KEY) {
    return { skipped: true };
  }

  return resend.emails.send({
    from: 'Tribe Social <onboarding@resend.dev>',
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  });
};
