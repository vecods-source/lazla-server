import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

interface AccessTokenPayload extends JwtPayload {
  id: string;
}
const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

const ACCESS_EXPIRES_IN = (process.env.ACCESS_TOKEN_EXPIRES_IN ||
  "15m") as NonNullable<SignOptions["expiresIn"]>;
const REFRESH_EXPIRES_IN = (process.env.REFRESH_TOKEN_EXPIRES_IN ||
  "7d") as NonNullable<SignOptions["expiresIn"]>;

if (!accessSecret || !refreshSecret) {
  throw new Error("JWT secrets are not set in env");
}

export const signAccessToken = (payload: object) => {
  return jwt.sign(payload, accessSecret, { expiresIn: ACCESS_EXPIRES_IN });
};

export const signRefreshToken = (payload: object) => {
  return jwt.sign(payload, refreshSecret, { expiresIn: REFRESH_EXPIRES_IN });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, accessSecret) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, refreshSecret);
};
