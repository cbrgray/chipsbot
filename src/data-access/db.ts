import { Pool, QueryResult, types } from 'pg';


overrideDateParser();

let dbPool: Pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'PROD' ? { rejectUnauthorized: false } : false
});

export async function query(query: string): Promise<QueryResult<any>> {
    const result = await dbPool.query(query);
    return result;
}

// Dumb shit https://github.com/brianc/node-postgres/issues/429#issuecomment-24870258
function overrideDateParser() {
    const DATE_OID: number = 1082;
    const TIMESTAMPTZ_OID: number = 1184;
    const TIMESTAMP_OID: number = 1114;
    const parseFn = (val: any) => {
        return val;
    };
    types.setTypeParser(DATE_OID, parseFn);
    types.setTypeParser(TIMESTAMPTZ_OID, parseFn);
    types.setTypeParser(TIMESTAMP_OID, parseFn);
}
