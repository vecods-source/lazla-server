import { query } from "../config/db/pool";

export type CustomerRow = {
  id: string;
  username?: string | null;
  email?: string | null;
  email_verified?: boolean;
  email_otp?: string | null;
  otp_expires_at?: Date | null;
  hashed_password?: string | null;
  refresh_token?: string | null;
  created_at?: string;
};

/**
 * Finds a customer by id
 */
export const findCustomerById = async (
  id: string
): Promise<CustomerRow | undefined> => {
  const { rows } = await query(
    `SELECT id, username, email, hashed_password, refresh_token, created_at FROM customer WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0];
};

/**
 * Finds a customer by email
 */
export const findCustomerByEmail = async (
  email: string
): Promise<CustomerRow | undefined> => {
  const { rows } = await query(
    `SELECT id, username, email, hashed_password, refresh_token, created_at FROM customer WHERE email = $1 LIMIT 1`,
    [email]
  );
  return rows[0];
};
export const findHashedOTPbyEmail = async (
  email: string
): Promise<string | undefined> => {
  const { rows } = await query(
    `SELECT email_otp FROM customer WHERE email = $1 LIMIT 1`,
    [email]
  );
  return rows[0].email_otp;
};
export const findExpireOTpTime = async (
  email: string
): Promise<string | undefined> => {
  const { rows } = await query(
    `SELECT otp_expires_at FROM customer WHERE email = $1 LIMIT 1`,
    [email]
  );
  return rows[0].otp_expires_at;
};
export const isVerifiedEmailCustomer = async (
  email: string
): Promise<boolean> => {
  const { rows } = await query(
    `SELECT 1 FROM customer WHERE email = $1 AND email_verified = true LIMIT 1`,
    [email]
  );

  return rows.length > 0;
};
export const verfiyEmail = async (
  email: string
): Promise<CustomerRow | undefined> => {
  const { rows } = await query(
    `UPDATE customer SET email_verified = true, updated_at = now(), email_otp = NULL,
      otp_expires_at = NULL WHERE email = $1`,
    [email]
  );
  return rows[0];
};
export const updateCustomerVerificationFields = async (
  otp: string,
  otp_expires_at: Date,
  id: string
): Promise<boolean | undefined> => {
  const { rows } = await query(
    `UPDATE customer SET email_otp = $1, otp_expires_at = $2 WHERE id = $3 RETURNING *`,
    [otp, otp_expires_at, id]
  );
  return rows.length > 0;
};

/**
 * Finds a customer by username
 */
export const findCustomerByUsername = async (
  username: string
): Promise<CustomerRow | undefined> => {
  const { rows } = await query(
    `SELECT id, username, email, hashed_password, refresh_token, created_at FROM customer WHERE username = $1 LIMIT 1`,
    [username]
  );
  return rows[0];
};

/**
 * Find by refresh token (useful for logout / rotate checks).
 * NOTE: storing raw refresh tokens in DB is simple but not ideal. Prefer storing a hash of the token.
 */
export const findCustomerByRefreshToken = async (
  refreshToken: string
): Promise<CustomerRow | undefined> => {
  const { rows } = await query(
    `SELECT id, username, email, hashed_password, refresh_token, created_at FROM customer WHERE refresh_token = $1 LIMIT 1`,
    [refreshToken]
  );
  return rows[0];
};

/**
 * Create a new customer.
 * The caller should hash the password before calling (separation of concerns).
 * Returns the created row (id, username, email, created_at).
 */
export const createCustomer = async (
  username: string,
  email: string,
  hashedPassword: string,
  otp: string,
  otp_expires_at: Date
) => {
  const { rows } = await query(
    `INSERT INTO customer (username, email, hashed_password,email_otp,otp_expires_at) 
     VALUES ($1, $2, $3,$4,$5)
     RETURNING id, username, email, created_at`,
    [username, email, hashedPassword, otp, otp_expires_at]
  );
  return rows[0];
};

/**
 * Update customer's password (expects hashed password).
 */
export const updateCustomerPassword = async (
  customerId: string,
  hashedPassword: string
) => {
  await query(
    `UPDATE customer SET hashed_password = $1, updated_at = now() WHERE id = $2`,
    [hashedPassword, customerId]
  );
};

/**
 * Save (or replace) refresh token for a customer.
 * Consider saving a hash of the refresh token instead of raw token.
 */
export const saveCustomerRefreshToken = async (
  customerId: string,
  refreshToken: string | null
) => {
  await query(`UPDATE customer SET refresh_token = $1 WHERE id = $2`, [
    refreshToken,
    customerId,
  ]);
};

/**
 * Clear refresh token (logout).
 */
export const clearCustomerRefreshToken = async (customerId: string) => {
  await saveCustomerRefreshToken(customerId, null);
};

/**
 * Delete customer (logical deletion can be implemented as needed).
 */
export const deleteCustomer = async (customerId: number) => {
  await query(`DELETE FROM customer WHERE id = $1`, [customerId]);
};

/**
 * Public profile (safe to return to frontend)
 */
export const getCustomerPublicProfile = async (customerId: number) => {
  const { rows } = await query(
    `SELECT id, username, email, created_at FROM customer WHERE id = $1 LIMIT 1`,
    [customerId]
  );
  return rows[0];
};
