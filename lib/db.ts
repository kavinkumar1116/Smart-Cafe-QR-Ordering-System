import pg from "pg";
import type { Pool as PgPool } from "pg";

const { Pool } = pg;

const hasDatabaseConfig =
  process.env.DB_USER &&
  process.env.DB_HOST &&
  process.env.DB_NAME &&
  process.env.DB_PASSWORD &&
  process.env.DB_PORT;

let pool: PgPool | null = null;

if (hasDatabaseConfig) {
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
}

export default pool;

export function isDatabaseEnabled(): boolean {
  return Boolean(pool);
}
