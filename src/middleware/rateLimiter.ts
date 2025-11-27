import { NextFunction, Request, Response } from "express";

interface RequestInfo {
  count: number;
  lastRequest: number;
}

const requestCounts = new Map<string, RequestInfo>();

const PRUNE_AFTER_MS = 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [ip, info] of requestCounts.entries()) {
    if (now - info.lastRequest > PRUNE_AFTER_MS) {
      requestCounts.delete(ip);
    }
  }
}, 30 * 60 * 1000);

/**
 * Generic rate limiter middleware
 * @param maxRequests Max requests allowed in window
 * @param windowMs Window time in milliseconds
 */
export const rateLimiter = (maxRequests = 100, windowMinutes = 15) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const windowMs = windowMinutes * 60 * 1000;

    const rawIp =
      req.ip ??
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0] ??
      req.socket.remoteAddress ??
      "unknown";
    const ip = String(rawIp).trim();

    const now = Date.now();
    const ipData = requestCounts.get(ip);

    if (!ipData) {
      // First request from this IP
      requestCounts.set(ip, { count: 1, lastRequest: now });
    } else {
      const timeSinceLastRequest = now - ipData.lastRequest;

      if (timeSinceLastRequest < windowMs) {
        // Within window, increment
        ipData.count += 1;
        ipData.lastRequest = now;
        requestCounts.set(ip, ipData);
      } else {
        // Outside window, reset
        requestCounts.set(ip, { count: 1, lastRequest: now });
      }
    }

    const currentCount = requestCounts.get(ip)?.count ?? 0;

    if (currentCount > maxRequests) {
      return res.status(429).json({
        message: `Too many requests. Please try again later.`,
      });
    }

    next();
  };
};
