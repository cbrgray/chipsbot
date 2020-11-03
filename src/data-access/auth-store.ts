import { query } from '../data-access/db';
import { toSqlValues } from '../util';

export { AuthStoreRecord, initialiseTable, getAllUsernames, getUserRecord, upsertUserRecord, removeUserRecord };


type AuthStoreRecord = { username: string, userId: number, accessToken: string, refreshToken: string };

const tableName: string = 'auth_store';

async function initialiseTable() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS ${tableName}(
                username VARCHAR ( 50 ) PRIMARY KEY,
                user_id INT NULL,
                access_token VARCHAR ( 255 ) NULL,
                refresh_token VARCHAR ( 255 ) NULL
            );
        `);
    } catch (e) {
        throw new Error(`Failed to initialise authstore DB: ${e.message}`);
    }
}

async function getAllUsernames(): Promise<string[]> {
    let result = await query(`SELECT username FROM ${tableName};`);
    return result.rows.map(p => p.username);
}

async function getUserRecord(username: string): Promise<AuthStoreRecord> {
    let result = await query(`SELECT * FROM ${tableName} WHERE username='${username}';`);
    if (result.rowCount !== 1 || !result.rows[0].user_id) {
        throw new Error(`No authstore record found for ${username}`);
    }
    let row: any = result.rows[0];
    return { username: row.username, userId: parseInt(row.user_id), accessToken: row.access_token, refreshToken: row.refresh_token };
}

async function upsertUserRecord(record: AuthStoreRecord) {
    await query(`
        INSERT INTO ${tableName}(username, user_id, access_token, refresh_token)
        VALUES(${toSqlValues([record.username, record.userId, record.accessToken, record.refreshToken])})
        ON CONFLICT (username) DO UPDATE
        SET user_id = excluded.user_id,
            access_token = excluded.access_token,
            refresh_token = excluded.refresh_token;
    `);
}

async function removeUserRecord(record: AuthStoreRecord) {
    await query(`DELETE FROM ${tableName} WHERE username='${record.username}';`);
}
