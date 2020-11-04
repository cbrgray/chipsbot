import { charCount, toSqlValues, escapeSql, formatDate } from '../src/util';


describe('charCount', () => {
    
    let text: string = 'The kuick brown fox\njumps over tthe\nlazy dog!';

    test('counts characters', () => {
        expect(charCount(text, 'T')).toBe(1);
        expect(charCount(text, 't')).toBe(2);
        expect(charCount(text, 'q')).toBe(0);
        expect(charCount(text, '!')).toBe(1);
    });

    test('counts newlines', () => {
        expect(charCount(text, '\n')).toBe(2);
    });

});

describe('toSqlValues', () => {

    test('converts apostrophes, nulls, undefineds and strings', () => {
        expect(toSqlValues(['asdf', 'test test', null, undefined])).toBe("'asdf', 'test test', NULL, NULL");
    });

});

describe('escapeSql', () => {

    test('escapes apostrophes in SQL style', () => {
        expect(escapeSql("This is a's test")).toBe("This is a''s test");
    });

});

describe('formatDate', () => {

    let date: Date = new Date('May 13, 1992 03:24:00');

    test('outputs the expected format', () => {
        expect(formatDate(date)).toBe('1992-05-13');
    });

});
