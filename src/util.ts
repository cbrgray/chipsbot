export { charCount, toSqlValues }

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
