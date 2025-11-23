import { query } from "../db/pool";

export type CustomerRow = {
  id: number;
  username?: string | null;
  email?: string | null;
  hashed_password?: string | null;
  refresh_token?: string | null;
  created_at?: string;
};

/**
 * Finds a customer by id
 */
export const findCustomerById = async (
  id: number
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
    [email.toLowerCase()]
  );
  return rows[0];
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
  username: string | null,
  email: string | null,
  hashedPassword: string | null
) => {
  const { rows } = await query(
    `INSERT INTO customer (username, email, hashed_password) 
     VALUES ($1, $2, $3)
     RETURNING id, username, email, created_at`,
    [username, email?.toLowerCase(), hashedPassword]
  );
  return rows[0];
};

/**
 * Update customer's password (expects hashed password).
 */
export const updateCustomerPassword = async (
  customerId: number,
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
  customerId: number,
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
export const clearCustomerRefreshToken = async (customerId: number) => {
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
