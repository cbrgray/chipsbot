import * as util from '../src/util';


describe('charCount', () => {
    
    let text: string = 'The kuick brown fox\njumps over tthe\nlazy dog!';

    test('counts characters', () => {
        expect(util.charCount(text, 'T')).toBe(1);
        expect(util.charCount(text, 't')).toBe(2);
        expect(util.charCount(text, 'q')).toBe(0);
        expect(util.charCount(text, '!')).toBe(1);
    });

    test('counts newlines', () => {
        expect(util.charCount(text, '\n')).toBe(2);
    });

});

describe('toSqlValues', () => {

    test('converts apostrophes, nulls, undefineds and strings', () => {
        expect(util.toSqlValues(['asdf', 'test test', null, undefined])).toBe("'asdf', 'test test', NULL, NULL");
    });

});

describe('escapeSql', () => {

    test('escapes apostrophes in SQL style', () => {
        expect(util.escapeSql("This is a's test")).toBe("This is a''s test");
    });

});

describe('formatDate', () => {

    let date: Date = new Date('May 13, 1992 03:24:00');

    test('outputs the expected format', () => {
        expect(util.formatDate(date)).toBe('1992-05-13');
    });

});

describe('parseCommandArgs', () => {

    test('parses normal command and args', () => {
        const parsed = util.parseCommandArgs('command arg1 arg2');
        expect(parsed[0]).toEqual('command');
        expect(parsed[1]).toEqual(['arg1', 'arg2']);
    });

    test('parses string args', () => {
        const parsed = util.parseCommandArgs('command somearg "some other arg"');
        expect(parsed[0]).toEqual('command');
        expect(parsed[1]).toEqual(['somearg', 'some other arg']);
    });

    test('parses empty string args', () => {
        const parsed = util.parseCommandArgs('command somearg "" finalarg');
        expect(parsed[1]).toEqual(['somearg', '', 'finalarg']);
    });

});
