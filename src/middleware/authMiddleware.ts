import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "missing auth token" });

  const token = authHeader.split(" ")[1] ?? "";
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.id };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "invalid or expired token" });
  }
};
