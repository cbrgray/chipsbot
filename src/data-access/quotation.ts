import { query } from '../data-access/db';
import { toSqlValues, escapeSql, formatDate } from '../util';

export { QuotationRecord, initialiseTable, getQuotation, insertQuotation, updateQuotation };


type QuotationRecord = { index?: number, person: string, date?: Date, customDate?: string, quotation: string };

const tableName: string = 'quotations';

async function initialiseTable() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS ${tableName}(
                id SERIAL PRIMARY KEY,
                person VARCHAR ( 255 ) NOT NULL,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                custom_date TEXT NULL,
                quotation TEXT NOT NULL
            );
        `);
    } catch (e) {
        throw new Error(`Failed to initialise quotation DB: ${e.message}`);
    }
}

async function getQuotation(index?: number): Promise<QuotationRecord> {
    let result;
    if (index === undefined || index === null) { // take random index - NB sql ids are ONLY unique, if we delete one, the 'index' is no longer correct
        result = await query(`SELECT * FROM ${tableName} OFFSET floor(random() * (SELECT COUNT(*) FROM ${tableName})) LIMIT 1;`);
    } else {
        result = await query(`SELECT * FROM ${tableName} WHERE id='${index}';`);
        if (result.rowCount !== 1) {
            throw new Error(`No quotation found at index ${index}`);
        }
    }
    let row: any = result.rows[0];
    return { index: parseInt(row.id), person: row.person, date: new Date(row.date), customDate: row.custom_date, quotation: row.quotation };
}

async function insertQuotation(record: QuotationRecord): Promise<number> {
    await query(`
        INSERT INTO ${tableName}(person, date, custom_date, quotation)
        VALUES(${toSqlValues([record.person, formatDate(record.date), record.customDate, escapeSql(record.quotation)])})
    `);
    const result = await query(`SELECT id FROM ${tableName} ORDER BY id DESC LIMIT 1;`);
    return result.rows[0].id;
}

async function updateQuotation(record: QuotationRecord) {
    await query(`
        UPDATE ${tableName}
        SET person='${record.person}',
            date='${formatDate(record.date)}',
            custom_date='${record.customDate}',
            quotation='${escapeSql(record.quotation)}'
        WHERE id=${record.index};
    `);
}
