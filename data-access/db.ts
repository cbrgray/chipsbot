import { Pool, QueryResult } from 'pg';


const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,  // TODO prod and dev .env
    ssl: {
        rejectUnauthorized: false
    }
    // ssl: false
});

export async function query(query: string): Promise<QueryResult<any>> {
    const result = await dbPool.query(query);
    return result;
}
