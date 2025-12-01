// routes.ts
import { Router } from "express";
import {
  recordAttemptHandler,
  confirmCollectedHandler,
  getEventsHandler,
  adminListEventsHandler,
} from "./payment.controller";

const router = Router();

/**
 * Driver records attempt or notes:
 * POST /api/delivery/:purchaseId/attempt
 */
router.post("/:purchaseId/attempt", recordAttemptHandler);

/**
 * Driver confirms COD collected:
 * POST /api/delivery/:purchaseId/collect
 * Protect with driver/staff auth middleware in production.
 */
router.post("/:purchaseId/collect", confirmCollectedHandler);

/**
 * Get events for a purchase:
 * GET /api/delivery/purchase/:purchaseId
 */
router.get("/purchase/:purchaseId", getEventsHandler);

/**
 * Admin listing:
 * GET /api/delivery/admin
 */
router.get("/admin", adminListEventsHandler);

export default router;
