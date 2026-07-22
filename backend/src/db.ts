import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl:
    process.env.DATABASE_SSL === 'false'
      ? undefined
      : process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : undefined,
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return pool.query<T>(text, params);
}
