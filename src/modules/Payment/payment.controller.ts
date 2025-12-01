// controllers.ts
import { Request, Response, NextFunction } from "express";
import service from "./payment.service";
import { RecordDeliveryAttemptDTO, ConfirmCodDTO } from "./payment.type";

/**
 * POST /api/delivery/:purchaseId/attempt
 * body: RecordDeliveryAttemptDTO
 * used by drivers to record attempts, notes, photos, etc.
 */
export const recordAttemptHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const purchaseId = Number(req.params.purchaseId);
    if (!purchaseId)
      return res.status(400).json({ message: "purchaseId required" });
    const dto: RecordDeliveryAttemptDTO = req.body ?? {};
    const row = await service.recordDeliveryAttempt(purchaseId, dto);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/delivery/:purchaseId/collect
 * body: ConfirmCodDTO
 * driver confirms cash collected -> marks purchase as paid and logs event
 * protect this route (driver/staff).
 */
export const confirmCollectedHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const purchaseId = Number(req.params.purchaseId);
    if (!purchaseId)
      return res.status(400).json({ message: "purchaseId required" });
    const dto: ConfirmCodDTO = req.body;
    if (typeof dto.collectedAmount !== "number")
      return res.status(400).json({ message: "collectedAmount required" });

    // performedBy can be from auth middleware (driver/staff id)
    const performedBy = (req as any).user?.id ?? null;

    const result = await service.confirmCodCollected(
      purchaseId,
      dto,
      performedBy
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/delivery/purchase/:purchaseId
 * returns payment_event rows for the purchase
 */
export const getEventsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const purchaseId = Number(req.params.purchaseId);
    if (!purchaseId)
      return res.status(400).json({ message: "purchaseId required" });
    const rows = await service.getEventsForPurchase(purchaseId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/** Admin: list all delivery/payment events */
export const adminListEventsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 50);
    const data = await service.listAllDeliveryEvents({ page, limit });
    res.json(data);
  } catch (err) {
    next(err);
  }
};
