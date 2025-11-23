import { Request, Response } from "express";
import {
  createCustomer,
  findCustomerByEmail,
  findCustomerById,
  saveCustomerRefreshToken,
  updateCustomerPassword,
  getCustomerPublicProfile,
  clearCustomerRefreshToken,
} from "../models/CustomerModel";
import { hashPassword, comparePassword } from "../utils/hast";
import { signAccessToken, verifyRefreshToken } from "../utils/jwt";
import {
  generateAndHashRefreshToken,
  verifyRefreshTokenHash,
} from "../utils/RefreshToken";

/**
 * POST /api/customer/signup
 * Body: { username?, email, password }
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "email and password required" });

    const existing = await findCustomerByEmail(email);
    if (existing)
      return res.status(409).json({ message: "email already in use" });

    const hashed = await hashPassword(password);
    const user = await createCustomer(username ?? null, email ?? null, hashed);

    const accessToken = signAccessToken({ id: user.id, type: "customer" });
    const { refresh, hashed: hashedRefresh } =
      await generateAndHashRefreshToken({ id: user.id, type: "customer" });

    await saveCustomerRefreshToken(user.id, hashedRefresh);

    return res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email },
      accessToken,
      refreshToken: refresh,
    });
  } catch (err) {
    console.error("customer.signup", err);
    return res.status(500).json({ message: "internal server error" });
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

    return res.json({
      user: { id: user.id, username: user.username, email: user.email },
      accessToken,
      refreshToken: refresh,
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

    const userId = Number(payload.id);
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

    return res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    console.error("customer.refresh", err);
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
      const userId = Number(payload.id);
      await clearCustomerRefreshToken(userId);
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
    const userId = Number((req as any).user?.id);
    if (!userId) return res.status(401).json({ message: "unauthorized" });

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
