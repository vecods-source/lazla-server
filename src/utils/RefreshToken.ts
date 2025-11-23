import bcrypt from "bcrypt";
import { signRefreshToken } from "./jwt";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

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
