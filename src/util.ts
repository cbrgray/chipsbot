export { charCount, toSqlValues, escapeSql, formatDate }

function charCount(text: string, char: string): number { // avoids the memory overhead of .split()
    let count: number = 0;
    for (let c of text) {
        if (c === char) {
            count++;
        }
    }
    return count;
}

function toSqlValues(vals: any[]): string {
    return vals.map(p => typeof p === 'string' ? `'${p}'` : (p === null || typeof p === 'undefined') ? 'NULL' : p).join(', ');
}

function escapeSql(text: string): string {
    // @ts-ignore: replaceAll is supported but is in ES2021 spec, and we're on ES2020
    return text.replaceAll("'", "''");
}

function formatDate(date: Date): string {
    return date.toISOString().substring(0, 10);
}
