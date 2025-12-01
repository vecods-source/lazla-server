// service.ts
import deliveryModel from "../../main.models/PaymentModule";
import { withTransaction, query } from "../../config/db/pool";
import { RecordDeliveryAttemptDTO, ConfirmCodDTO } from "./payment.type";
import { randomUUID } from "crypto";

/**
 * Record a delivery attempt / event (not finalizing payment).
 * This only writes into payment_event (audit). Use when driver attempts delivery.
 */
export const recordDeliveryAttempt = async (
  purchaseId: number,
  dto: RecordDeliveryAttemptDTO
) => {
  const eventType = dto.eventType ?? "delivery_attempt";
  const metadata: any = {
    driverId: dto.driverId ?? null,
    note: dto.note ?? null,
    photoUrl: dto.photoUrl ?? null,
    collectedAmount: dto.collectedAmount ?? null,
  };

  // not in transaction (simple insert)
  const row = await deliveryModel.insertPaymentEvent(
    null,
    purchaseId,
    eventType,
    dto.eventStatus ?? null,
    "cod",
    null,
    metadata
  );
  return row;
};

/**
 * Confirm COD collected by driver.
 * Atomic: insert payment_event, update purchase table, insert order_status_history.
 */
export const confirmCodCollected = async (
  purchaseId: number,
  dto: ConfirmCodDTO,
  performedBy?: number | null
) => {
  return withTransaction(async (client) => {
    // 1) Ensure purchase exists and not already paid
    const { rows: pRows } = await client.query(
      "SELECT id, payment_status FROM purchase WHERE id = $1 FOR UPDATE",
      [purchaseId]
    );
    if (!pRows[0]) throw new Error("purchase not found");
    const currentStatus = pRows[0].payment_status;

    // Optional: if already paid, return existing info
    if (currentStatus === "paid") {
      // still log event for audit
    }

    // 2) create txnId if not provided
    const txnId = dto.txnId ?? `COD-${randomUUID()}`;

    // 3) insert payment_event row (cod_collected)
    const metadata = {
      driverId: dto.driverId ?? null,
      collectedAmount: dto.collectedAmount,
      note: dto.note ?? null,
    };
    const event = await deliveryModel.insertPaymentEvent(
      client,
      purchaseId,
      "cod_collected",
      "paid",
      "cod",
      txnId,
      metadata
    );

    // 4) update purchase: set payment_status, paid_at, payment_txn_id, updated_at
    await client.query(
      `UPDATE purchase SET payment_status = $1, paid_at = now(), payment_txn_id = $2, updated_at = now() WHERE id = $3`,
      ["paid", txnId, purchaseId]
    );

    // 5) insert order_status_history (mark payment confirmed; status chosen = 'confirmed')
    // This will also update purchase.current_status via your trigger if needed
    await client.query(
      `INSERT INTO order_status_history (order_id, changed_by, status, note) VALUES ($1,$2,$3,$4)`,
      [
        purchaseId,
        performedBy ?? null,
        "confirmed",
        `COD collected: ${dto.collectedAmount}`,
      ]
    );

    return { event };
  });
};

/** Fetch events */
export const getEventsForPurchase = async (purchaseId: number) => {
  return deliveryModel.getPaymentEventsForPurchase(purchaseId);
};

/** Admin listing */
export const listAllDeliveryEvents = async (opts: {
  page?: number;
  limit?: number;
}) => {
  return deliveryModel.listPaymentEvents(opts);
};

export default {
  recordDeliveryAttempt,
  confirmCodCollected,
  getEventsForPurchase,
  listAllDeliveryEvents,
};
