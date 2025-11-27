import { query } from "../config/db/pool";

export type StaffRow = {
  id: number;
  username: string;
  email?: string | null;
  hashed_password?: string | null;
  refresh_token?: string | null;
  created_at?: string;
  role?: "admin" | "driver";
  whatsapp_number?: string | null;
};

/**
 * Find staff by id
 */
export const findStaffById = async (
  id: number
): Promise<StaffRow | undefined> => {
  const { rows } = await query(
    `SELECT id, username, email, hashed_password, refresh_token, created_at, role, whatsapp_number
     FROM staff WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0];
};

/**
 * Find staff by username
 */
export const findStaffByUsername = async (
  username: string
): Promise<StaffRow | undefined> => {
  const { rows } = await query(
    `SELECT id, username, email, hashed_password, refresh_token, created_at, role, whatsapp_number
     FROM staff WHERE username = $1 LIMIT 1`,
    [username]
  );
  return rows[0];
};

/**
 * Find staff by email
 */
export const findStaffByEmail = async (
  email: string
): Promise<StaffRow | undefined> => {
  const { rows } = await query(
    `SELECT id, username, email, hashed_password, refresh_token, created_at, role, whatsapp_number
     FROM staff WHERE email = $1 LIMIT 1`,
    [email?.toLowerCase()]
  );
  return rows[0];
};

/**
 * Find by refresh token (for rotation / logout)
 */
export const findStaffByRefreshToken = async (
  refreshToken: string
): Promise<StaffRow | undefined> => {
  const { rows } = await query(
    `SELECT id, username, email, hashed_password, refresh_token, created_at, role, whatsapp_number
     FROM staff WHERE refresh_token = $1 LIMIT 1`,
    [refreshToken]
  );
  return rows[0];
};

/**
 * Create staff (admin/driver). hashedPassword should be provided by the caller.
 * Returns the created identifying fields.
 */
export const createStaff = async (
  username: string,
  email: string | null,
  hashedPassword: string | null,
  role: "admin" | "driver" = "admin",
  whatsappNumber: string | null = null
) => {
  const { rows } = await query(
    `INSERT INTO staff (username, email, hashed_password, role, whatsapp_number)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, email, role, whatsapp_number, created_at`,
    [username, email?.toLowerCase(), hashedPassword, role, whatsappNumber]
  );
  return rows[0];
};

/**
 * Update staff password (expects hashed password)
 */
export const updateStaffPassword = async (
  staffId: number,
  hashedPassword: string
) => {
  await query(
    `UPDATE staff SET hashed_password = $1, updated_at = now() WHERE id = $2`,
    [hashedPassword, staffId]
  );
};

/**
 * Save / replace refresh token
 * Again: consider hashing refresh tokens before saving.
 */
export const saveStaffRefreshToken = async (
  staffId: number,
  refreshToken: string | null
) => {
  await query(`UPDATE staff SET refresh_token = $1 WHERE id = $2`, [
    refreshToken,
    staffId,
  ]);
};

export const clearStaffRefreshToken = async (staffId: number) => {
  await saveStaffRefreshToken(staffId, null);
};

/**
 * Update staff contact / role (partial update)
 */
export const updateStaffProfile = async (
  staffId: number,
  changes: {
    email?: string | null;
    whatsapp_number?: string | null;
    role?: "admin" | "driver";
  }
) => {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (typeof changes.email !== "undefined") {
    fields.push(`email = $${idx++}`);
    values.push(changes.email?.toLowerCase() ?? null);
  }
  if (typeof changes.whatsapp_number !== "undefined") {
    fields.push(`whatsapp_number = $${idx++}`);
    values.push(changes.whatsapp_number ?? null);
  }
  if (typeof changes.role !== "undefined") {
    fields.push(`role = $${idx++}`);
    values.push(changes.role);
  }

  if (fields.length === 0) return;

  values.push(staffId); // last param
  const sql = `UPDATE staff SET ${fields.join(
    ", "
  )}, updated_at = now() WHERE id = $${idx} RETURNING id, username, email, role, whatsapp_number`;
  const { rows } = await query(sql, values);
  return rows[0];
};

/**
 * Delete staff (hard delete)
 */
export const deleteStaff = async (staffId: number) => {
  await query(`DELETE FROM staff WHERE id = $1`, [staffId]);
};
