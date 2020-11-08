export function charCount(text: string, char: string): number { // avoids the memory overhead of .split()
    let count: number = 0;
    for (let c of text) {
        if (c === char) {
            count++;
        }
    }
    return count;
}

export function toSqlValues(vals: any[]): string {
    return vals.map(p => typeof p === 'string' ? `'${p}'` : (p === null || typeof p === 'undefined') ? 'NULL' : p).join(', ');
}

export function escapeSql(text: string): string {
    // @ts-ignore: replaceAll is supported but is in ES2021 spec, and we're on ES2020
    return text.replaceAll("'", "''");
}

export function formatDate(date: Date): string {
    return date.toISOString().substring(0, 10);
}

export function parseCommandArgs(str: string): [string, string[]] {
    let protoArgs: string[] = str.split(' ');
    let args: string[] = [];
    const cmd: string = protoArgs.shift();
    let isQuote: boolean = false;
    let quotedCmd: string[] = [];

    for (let arg of protoArgs) {
        if (arg.startsWith('"')) {
            isQuote = true;
            arg = arg.substring(1);
            quotedCmd = [];
        }
        if (arg.endsWith('"')) {
            isQuote = false;
            quotedCmd.push(arg.substring(0, arg.length-1));
            args.push(quotedCmd.join(' '));
            continue;
        }
        
        if (!isQuote) {
            args.push(arg);
        } else {
            quotedCmd.push(arg);
        }
    }
    if (isQuote) {
        args = [];
    }
    
    return [cmd, args];
}
