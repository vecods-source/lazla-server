import { SignOptions } from "jsonwebtoken";

export const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
export const accessSecret = process.env.JWT_ACCESS_SECRET;
export const refreshSecret = process.env.JWT_REFRESH_SECRET;
export const ACCESS_EXPIRES_IN = (process.env.ACCESS_TOKEN_EXPIRES_IN ||
  "15m") as NonNullable<SignOptions["expiresIn"]>;
export const REFRESH_EXPIRES_IN = (process.env.REFRESH_TOKEN_EXPIRES_IN ||
  "7d") as NonNullable<SignOptions["expiresIn"]>;
