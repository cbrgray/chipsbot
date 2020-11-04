import { Pool, QueryResult } from 'pg';


let dbPool: Pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'PROD' ? { rejectUnauthorized: false } : false
});

export async function query(query: string): Promise<QueryResult<any>> {
    const result = await dbPool.query(query);
    return result;
}
