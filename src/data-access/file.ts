import * as fs from 'fs';
import { charCount } from '../util';
import * as dch from '../data-access/dropbox-content-hasher';


type Encoding = 'utf8' | 'ascii' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex';

export class File {

    public readonly path: string = '';
    public readonly encoding: Encoding = 'utf8';

    constructor(path: string, encoding?: Encoding) {
        this.path = path;
        this.encoding = encoding ?? 'utf8';
    }

    public read(): string {
        if (fs.existsSync(this.path)) {
            return fs.readFileSync(this.path, this.encoding);
        } else {
            return '';
        }
    }

    public readLines(): string[] {
        return this.read().split('\n').filter(p => p !== '');
    }

    public *readRandomLine(): Generator<string> {
        const lines: string[] = this.readLines();
        while (true) {
            let randomIndex: number = Math.floor(Math.random() * lines.length);
            yield lines[randomIndex];
        }
    }

    public write(data: string): void {
        fs.writeFileSync(this.path, data, this.encoding);
    }

    public append(data: string): void {
        fs.appendFileSync(this.path, data, this.encoding);
    }

    public appendLine(data: string): void {
        this.append('\n' + data);
    }

    public delete(): void {
        fs.unlinkSync(this.path);
    }

    public lineCount(): number {
        const text: string = this.read();
        return charCount(text, '\n') + 1;
    }

    public getDropboxHash(): string {
        const hasher = dch.create();
        const chunk: Buffer = fs.readFileSync(this.path);
        hasher.update(chunk);
        return hasher.digest('hex');
    }

}
