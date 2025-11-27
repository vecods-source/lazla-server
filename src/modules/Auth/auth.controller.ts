import { Request, Response } from "express";
import {
  createCustomer,
  findCustomerByEmail,
  findCustomerById,
  saveCustomerRefreshToken,
  updateCustomerPassword,
  getCustomerPublicProfile,
  clearCustomerRefreshToken,
  findCustomerByUsername,
  isVerifiedEmailCustomer,
  verfiyEmail,
  findHashedOTPbyEmail,
  updateCustomerVerificationFields,
  findExpireOTpTime,
} from "../../main.models/CustomerModel";
import {
  hashPassword,
  comparePassword,
  generateOTP,
  sendOtpEmail,
  hashOTP,
  expiresInMinutes,
  timingSafeCompare,
  isExpired,
} from "./auth.services";
import { signAccessToken, verifyRefreshToken } from "./auth.services";
import {
  generateAndHashRefreshToken,
  verifyRefreshTokenHash,
} from "./auth.services";

/**
 * POST /api/customer/signup
 * Body: { username?, email, password }
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const normalized = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim().toLowerCase();
    // validation
    if (!username || !email || !password) {
      res.sendStatus(401).json({
        error: "provide the required field username, password, and email",
      });
      return;
    }
    if (
      (await isVerifiedEmailCustomer(normalized)) ||
      (await findCustomerByEmail(normalized))
    ) {
      res.status(400).json({ error: "email already registered" });
      return;
    }
    if (await findCustomerByUsername(normalizedUsername)) {
      res.status(400).json({ error: "username already registered" });
      return;
    }

    // hashing and token config
    const hashed_pass = await hashPassword(password);

    // otp prep
    const otpPlain = generateOTP(8);
    const otpHash = hashOTP(otpPlain);
    const otpExpiry = expiresInMinutes(15);
    try {
      sendOtpEmail(email, otpPlain);
    } catch {
      res.status(400).json({ error: "failed to send email" });
      return;
    }
    const user = await createCustomer(
      username,
      email,
      hashed_pass,
      otpHash,
      otpExpiry
    );
    const accessToken = signAccessToken({ id: user.id, type: "customer" });
    const { refresh, hashed: hashedRefresh } =
      await generateAndHashRefreshToken({
        id: user.id,
        type: "customer",
      });

    await saveCustomerRefreshToken(user.id, hashedRefresh);
    res.cookie("refreshToken", refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/customer/refresh",
      maxAge: 1000 * 60 * 60 * 24 * 365 * 100,
    });
    return res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email },
      accessToken,
    });
  } catch (err) {
    console.error("customer.signup", err);
    return res.status(500).json({ message: "internal server error" });
  }
};
export const verfyEmail = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const normalized = String(email).trim().toLowerCase();

  if (!email || !otp) {
    res.status(400).json({ error: "no email or otp recieved" });
    return;
  }
  const ExpireTime = await findExpireOTpTime(normalized);
  if (!ExpireTime) {
    res
      .status(404)
      .json({ erro: "no expire time for this otp meaning no otp sent" });
    return;
  }
  const hashedOTP = await findHashedOTPbyEmail(normalized);
  if (!hashOTP) {
    res.status(400).json({ error: "no stored otp try resending" });
    return;
  }

  const hashedUserOTP = hashOTP(otp);
  const ok = timingSafeCompare(hashedOTP!, hashedUserOTP);
  if (ok) {
    if (isExpired(ExpireTime, 10)) {
      res.status(400).json({ error: "otp expired", expired: true });
      return;
    }
    await verfiyEmail(email);
    res.status(200).json({ message: "user email verified", verified: true });
  } else {
    res.status(400).json({ error: "invalid otp", invalid: true });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const normalized = String(email).trim().toLowerCase();

    if (!email) return res.status(400).json({ error: "email required" });
    const user = await findCustomerByEmail(normalized);
    if (!user) return res.status(400).json({ error: "user not found" });

    if (user.email_verified) {
      return res.status(200).json({ message: "Email already verified" });
    }

    const otpPlain = generateOTP(6);
    const otpHash = hashOTP(otpPlain);
    const otpExpiry = expiresInMinutes(15);
    console.log("6");

    // Update DB
    await updateCustomerVerificationFields(otpHash, otpExpiry, user.id);
    console.log("updating the database");

    await sendOtpEmail(email, otpPlain);

    return res.status(200).json({ message: "OTP resent to your email" });
  } catch (err) {
    console.error("resendOtp error", err);
    return res.status(500).json({ error: "internal server error" });
  }
};

/**
 * POST /api/customer/login
 * Body: { email, password }
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "email and password required" });

    const user = await findCustomerByEmail(email);
    if (!user || !user.hashed_password)
      return res.status(401).json({ message: "invalid credentials" });

    const valid = await comparePassword(password, user.hashed_password);
    if (!valid) return res.status(401).json({ message: "invalid credentials" });

    const accessToken = signAccessToken({ id: user.id, type: "customer" });
    const { refresh, hashed: hashedRefresh } =
      await generateAndHashRefreshToken({ id: user.id, type: "customer" });

    await saveCustomerRefreshToken(user.id, hashedRefresh);
    res.cookie("refreshToken", refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/customer/refresh",
      maxAge: 1000 * 60 * 60 * 24 * 365 * 100,
    });
    return res.json({
      user: { id: user.id, username: user.username, email: user.email },
      accessToken,
    });
  } catch (err) {
    console.error("customer.login", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * POST /api/customer/refresh
 * Body: { refreshToken }
 * - verifies JWT signature, compares bcrypt hash in DB, rotates refresh token on success
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "refreshToken required" });

    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (e) {
      return res.status(401).json({ message: "invalid refresh token" });
    }

    const userId = payload.id;
    const user = await findCustomerById(userId);
    if (!user || !user.refresh_token)
      return res.status(401).json({ message: "refresh token not found" });

    const match = await verifyRefreshTokenHash(
      refreshToken,
      user.refresh_token
    );
    if (!match)
      return res.status(401).json({ message: "refresh token mismatch" });

    // Rotation: issue new refresh token and replace hashed value in DB
    const accessToken = signAccessToken({ id: userId, type: "customer" });
    const { refresh: newRefresh, hashed: newHashed } =
      await generateAndHashRefreshToken({ id: userId, type: "customer" });

    await saveCustomerRefreshToken(userId, newHashed);
    res.cookie("refreshToken", newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/customer/refresh",
      maxAge: 1000 * 60 * 60 * 24 * 365 * 100,
    });
    return res.json({ accessToken });
  } catch (err) {
    console.error("customer.refresh", err);
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * POST /api/customer/logout
 * Body: { refreshToken }
 * - clears stored refresh token for that user (best-effort; returns 200 even if token invalid)
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "refreshToken required" });

    try {
      const payload: any = verifyRefreshToken(refreshToken);
      const userId = payload.id;
      await clearCustomerRefreshToken(userId);
      res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
    } catch (e) {
      // swallow: avoid leaking token validity info
    }

    return res.status(200).json({ message: "logged out" });
  } catch (err) {
    console.error("customer.logout", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * POST /api/customer/change-password
 * Protected route (requireAuth)
 * Body: { oldPassword, newPassword }
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    // requireAuth middleware should set req.user.id
    const userId = req.user?.id;
    console.log("all good: ", userId);
    if (!userId) {
      res.status(401).json({ message: "unauthorized" });
      return;
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res
        .status(400)
        .json({ message: "oldPassword and newPassword required" });

    const user = await findCustomerById(userId);
    if (!user || !user.hashed_password)
      return res.status(404).json({ message: "user not found" });

    const ok = await comparePassword(oldPassword, user.hashed_password);
    if (!ok) return res.status(401).json({ message: "invalid credentials" });

    const newHashed = await hashPassword(newPassword);
    await updateCustomerPassword(userId, newHashed);

    // optional: clear refresh tokens (force re-login)
    await clearCustomerRefreshToken(userId);

    return res.json({ message: "password changed" });
  } catch (err) {
    console.error("customer.changePassword", err);
    return res.status(500).json({ message: "internal server error" });
  }
};

/**
 * GET /api/customer/me
 * Protected route (requireAuth)
 */
export const me = async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).user?.id);
    if (!userId) return res.status(401).json({ message: "unauthorized" });

    const profile = await getCustomerPublicProfile(userId);
    if (!profile) return res.status(404).json({ message: "user not found" });

    return res.json({ user: profile });
  } catch (err) {
    console.error("customer.me", err);
    return res.status(500).json({ message: "internal server error" });
  }
};
