import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@singuage.app';

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_PORT) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  const subject = 'Singuage — Password reset request';
  const text = `You (or someone using this email) requested a password reset for your Singuage account.
This is a single-use link and will expire in 30 minutes.

Open the link below to reset your password:

${resetLink}

If you didn't request this, you can safely ignore this email.`;

  const html = `<p>You (or someone using this email) requested a password reset for your Singuage account.</p>
<p><strong>This is a single-use link and will expire in 30 minutes.</strong></p>
<p>Open the link below to reset your password:</p>
<p><a href="${resetLink}">${resetLink}</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>`;

  if (!transporter) {
    // No SMTP configured — log the reset link for local/dev use
    console.warn('SMTP not configured. Password reset link (dev only):', resetLink);
    return;
  }

  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error('Failed to send password reset email:', err);
    // don't throw — email failure should not reveal existence
  }
};