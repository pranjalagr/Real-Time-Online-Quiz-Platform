import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const isLocalDatabaseHost = (host) => {
  if (!host) {
    return false;
  }

  const normalizedHost = String(host).toLowerCase();
  return normalizedHost === "localhost" || normalizedHost === "127.0.0.1" || normalizedHost === "::1";
};

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: isLocalDatabaseHost(process.env.DB_HOST) ? false : {
    rejectUnauthorized: false
  }
});
export default pool;
