import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, FROM_EMAIL } =
  process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !FROM_EMAIL) {
  throw new Error("SMTP environment variables not set");
}

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE === "true",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export const sendMail = async (to: string, subject: string, html: string) => {
  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
};

export const sendOtpEmail = async (to: string, otp: string) => {
  const html = `
    <p>Your verification OTP is: <b>${otp}</b></p>
    <p>This OTP will expire in 10 minutes.</p>
  `;
  return sendMail(to, "Your Verification OTP", html);
};
