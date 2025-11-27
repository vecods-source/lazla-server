import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../modules/Auth/auth.services";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("hello world");
    return res.status(401).json({ message: "missing auth token" });
  }
  const token = authHeader.split(" ")[1] ?? "";
  console.log("token nice: ");
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.id };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "invalid or expired token" });
  }
};
