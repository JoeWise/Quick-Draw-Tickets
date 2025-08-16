import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

// Load different env files depending on NODE_ENV
if (process.env.NODE_ENV === 'test') 
    dotenv.config({ path: '.env.test' });
else
    dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function query<T extends QueryResultRow = any>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    return pool.query(text, params);
}

export async function queryAsTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const poolClient = await pool.connect();
    try 
    {
        await poolClient.query('BEGIN');
        const result = await fn(poolClient);
        await poolClient.query('COMMIT');
        return result;
    } 
    catch (err) 
    {
        await poolClient.query('ROLLBACK');
        throw err;
    } 
    finally 
    {
        poolClient.release();
    }
}

export async function end() 
{
    await pool.end();
}

export default { query, queryAsTransaction, end };
