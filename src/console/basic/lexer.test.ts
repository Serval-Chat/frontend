import { describe, expect, it } from 'vitest';

import { tokenize } from '@/console/basic/lexer';
import { BasicSyntaxError } from '@/console/basic/types';

describe('tokenize', (): void => {
    it('tokenizes a simple PRINT statement', (): void => {
        expect(tokenize('PRINT "HELLO"')).toEqual([
            { type: 'IDENT', text: 'PRINT' },
            { type: 'STRING', text: 'HELLO' },
            { type: 'EOL', text: '' },
        ]);
    });

    it('normalizes identifiers to uppercase and keeps trailing $ on string vars', (): void => {
        expect(tokenize('let name$ = "bob"')).toEqual([
            { type: 'IDENT', text: 'LET' },
            { type: 'IDENT', text: 'NAME$' },
            { type: 'OP', text: '=' },
            { type: 'STRING', text: 'bob' },
            { type: 'EOL', text: '' },
        ]);
    });

    it('tokenizes numbers including decimals', (): void => {
        expect(tokenize('3.14 + 2')).toEqual([
            { type: 'NUMBER', text: '3.14' },
            { type: 'OP', text: '+' },
            { type: 'NUMBER', text: '2' },
            { type: 'EOL', text: '' },
        ]);
    });

    it('tokenizes two-character comparison operators', (): void => {
        expect(tokenize('X <= 5 AND Y <> 3 OR Z >= 1')).toEqual([
            { type: 'IDENT', text: 'X' },
            { type: 'OP', text: '<=' },
            { type: 'NUMBER', text: '5' },
            { type: 'IDENT', text: 'AND' },
            { type: 'IDENT', text: 'Y' },
            { type: 'OP', text: '<>' },
            { type: 'NUMBER', text: '3' },
            { type: 'IDENT', text: 'OR' },
            { type: 'IDENT', text: 'Z' },
            { type: 'OP', text: '>=' },
            { type: 'NUMBER', text: '1' },
            { type: 'EOL', text: '' },
        ]);
    });

    it('treats everything after REM as a comment, even unrecognized symbols', (): void => {
        expect(tokenize('REM this is a comment! @#$%')).toEqual([
            { type: 'IDENT', text: 'REM' },
            { type: 'EOL', text: '' },
        ]);
    });

    it("treats everything after ' as a comment", (): void => {
        expect(tokenize("PRINT 1 ' trailing comment")).toEqual([
            { type: 'IDENT', text: 'PRINT' },
            { type: 'NUMBER', text: '1' },
            { type: 'EOL', text: '' },
        ]);
    });

    it('throws on an unterminated string', (): void => {
        expect(() => tokenize('PRINT "unterminated')).toThrow(
            BasicSyntaxError,
        );
    });

    it('throws on an unrecognized character', (): void => {
        expect(() => tokenize('PRINT 1 @ 2')).toThrow(BasicSyntaxError);
    });
});
