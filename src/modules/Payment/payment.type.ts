// types.ts
export type DeliveryEventType =
  | "delivery_attempt"
  | "delivery_failed"
  | "delivery_success"
  | "cod_collected" // driver collected cash at door
  | "cod_partial" // partial collection
  | "delivery_note"; // manual notes about delivery

export interface DeliveryEventRow {
  id: number;
  purchase_id: number;
  event_type: string;
  event_status: string | null;
  payment_method: string | null;
  txn_id: string | null;
  metadata: any | null;
  created_at: string;
}

export interface RecordDeliveryAttemptDTO {
  driverId?: number | null;
  eventType?: DeliveryEventType; // default 'delivery_attempt'
  eventStatus?: string | null; // optional snapshot or human-readable status
  collectedAmount?: number | null; // for cod_collected or cod_partial
  note?: string | null;
  photoUrl?: string | null; // optional proof photo URL
}

export interface ConfirmCodDTO {
  driverId?: number | null;
  collectedAmount: number;
  txnId?: string | null; // optional external or generated id
  note?: string | null;
}
