import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendMail } from "../../utils/mailer";
import { AccessTokenPayload } from "./auth.types";
import {
  accessSecret,
  refreshSecret,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  SALT_ROUNDS,
} from "./auth.constants";
import crypto from "crypto";

// autherization
export const hashPassword = async (plain: string) => {
  return bcrypt.hash(plain, SALT_ROUNDS);
};

export const comparePassword = async (plain: string, hash: string) => {
  return bcrypt.compare(plain, hash);
};

// access token
if (!accessSecret || !refreshSecret) {
  throw new Error("JWT secrets are not set in env");
}

export const signAccessToken = (payload: object) => {
  return jwt.sign(payload, accessSecret!, { expiresIn: ACCESS_EXPIRES_IN });
};

export const signRefreshToken = (payload: object) => {
  return jwt.sign(payload, refreshSecret!, { expiresIn: REFRESH_EXPIRES_IN });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, accessSecret!) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, refreshSecret!);
};

// refresh token
export const hashRefreshToken = async (token: string): Promise<string> => {
  return bcrypt.hash(token, SALT_ROUNDS);
};

export const verifyRefreshTokenHash = async (
  token: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(token, hash);
};

export const generateRefreshToken = (payload: object): string => {
  return signRefreshToken(payload);
};

export const generateAndHashRefreshToken = async (
  payload: object
): Promise<{ refresh: string; hashed: string }> => {
  const refresh = generateRefreshToken(payload);
  const hashed = await hashRefreshToken(refresh);
  return { refresh, hashed };
};

// otp config
export const generateOTP = (length = 6) => {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};
export const hashOTP = (otp: string) =>
  crypto.createHash("sha256").update(otp).digest("hex");
export const isExpired = (
  expireAt: Date | string,
  minutes: number
): boolean => {
  const date = new Date(expireAt);
  if (Number.isNaN(date.getTime())) return true;
  const expireLimit = date.getTime() + minutes * 60_000;
  return Date.now() > expireLimit;
};
export const timingSafeCompare = (a: string, b: string) => {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return crypto.timingSafeEqual(Buffer.alloc(bufA.length), bufB);
  }
  return crypto.timingSafeEqual(bufA, bufB);
};
export const expiresInMinutes = (mins: number) =>
  new Date(Date.now() + mins * 60 * 1000);

export const sendOtpEmail = async (to: string, otp: string) => {
  const html = `
                <!doctype html>
                <html>
                <head>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width,initial-scale=1" />
                  <style>
                    body { margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; }
                    .container { max-width:500px; margin:40px auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 3px 15px rgba(0,0,0,0.06); }
                    .header { background:#8B0000; color:white; text-align:center; padding:22px; font-size:22px; font-weight:800; letter-spacing:1px; }
                    .otp-box { text-align:center; padding:40px 20px; }
                    .otp { display:inline-block; font-size:40px; font-weight:800; color:#8B0000; padding:12px 24px; border-radius:12px; background:#fff5f5; border:2px solid #8B0000; letter-spacing:4px; }
                    .expire { text-align:center; font-size:14px; color:#444; margin:16px 0 26px; }
                    .footer { text-align:center; font-size:12px; color:#999; padding:15px; }
                  </style>
                </head>
                <body>

                  <div class="container">
                    <div class="header">Lazla</div>

                    <div class="otp-box">
                      <div class="otp">${otp}</div>
                      <p class="expire">Code expires in 10 minutes</p>
                    </div>

                    <div class="footer">© ${new Date().getFullYear()} Lazla</div>
                  </div>

                </body>
                </html>
                `;
  return sendMail(to, "Your Verification OTP", html);
};
