import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment");
}
export async function connectDB() {
  try {
    const client = await pool.connect();
    console.log("Connected to the database!");
    client.release();
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}

export const pool = new Pool({ connectionString });

export const query = (text: string, params?: any[]) => pool.query(text, params);
