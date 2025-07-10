import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function query<T extends QueryResultRow = any>(
  text: string,
  params?: (string | number)[]
): Promise<QueryResult<T>> {
  return pool.query(text, params);
}

export default { query };
