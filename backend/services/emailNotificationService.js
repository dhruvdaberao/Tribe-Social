import { sendEmail } from './emailService.js';

export const sendEmailNotification = async ({ user, type, subject, htmlContent }) => {
  if (!user || !user.email || !type || !subject) return;

  const emailEnabled = user.emailNotifications !== false;
  const prefEnabled = !user.emailPrefs || user.emailPrefs[type] !== false;

  if (!emailEnabled || !prefEnabled) return;

  try {
    await sendEmail({
      to: user.email,
      subject,
      htmlContent,
      textContent: subject,
    });
  } catch (error) {
    console.error('Failed to send notification email:', error?.message || error);
  }
};
