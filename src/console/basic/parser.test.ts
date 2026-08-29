import { describe, expect, it } from 'vitest';

import { parseStatements } from '@/console/basic/parser';
import { BasicSyntaxError } from '@/console/basic/types';

describe('parseStatements', (): void => {
    it('parses PRINT with mixed separators', (): void => {
        expect(parseStatements('PRINT "X="; X, "!"')).toEqual([
            {
                type: 'PrintStmt',
                parts: [
                    { kind: 'expr', expr: { type: 'StringLit', value: 'X=' } },
                    { kind: 'sep', sep: ';' },
                    {
                        kind: 'expr',
                        expr: { type: 'VarRef', name: 'X', indices: null },
                    },
                    { kind: 'sep', sep: ',' },
                    {
                        kind: 'expr',
                        expr: { type: 'StringLit', value: '!' },
                    },
                ],
            },
        ]);
    });

    it('parses a bare assignment as LET', (): void => {
        expect(parseStatements('X = 5 + 2')).toEqual([
            {
                type: 'LetStmt',
                name: 'X',
                indices: null,
                value: {
                    type: 'BinaryOp',
                    op: '+',
                    left: { type: 'NumberLit', value: 5 },
                    right: { type: 'NumberLit', value: 2 },
                },
            },
        ]);
    });

    it('parses array assignment with an index', (): void => {
        expect(parseStatements('A(I) = 5')).toEqual([
            {
                type: 'LetStmt',
                name: 'A',
                indices: [{ type: 'VarRef', name: 'I', indices: null }],
                value: { type: 'NumberLit', value: 5 },
            },
        ]);
    });

    it('parses INPUT with a prompt and multiple variables', (): void => {
        expect(parseStatements('INPUT "Name and age"; N$, A')).toEqual([
            {
                type: 'InputStmt',
                prompt: { type: 'StringLit', value: 'Name and age' },
                vars: ['N$', 'A'],
            },
        ]);
    });

    it('parses INPUT without a prompt', (): void => {
        expect(parseStatements('INPUT X')).toEqual([
            { type: 'InputStmt', prompt: null, vars: ['X'] },
        ]);
    });

    it('parses IF/THEN/ELSE with multiple statements per branch', (): void => {
        const stmts = parseStatements(
            'IF X = 1 THEN PRINT "A": Y = 1 ELSE PRINT "B"',
        );
        expect(stmts).toHaveLength(1);
        const ifStmt = stmts[0] as { thenStmts: unknown[]; elseStmts: unknown[] };
        expect(ifStmt.thenStmts).toHaveLength(2);
        expect(ifStmt.elseStmts).toHaveLength(1);
    });

    it('allows a trailing PRINT separator immediately before ELSE, matching real BASIC', (): void => {
        const stmts = parseStatements(
            'IF X > 0.4 THEN PRINT "A"; ELSE PRINT " "',
        );
        expect(stmts).toHaveLength(1);
        const ifStmt = stmts[0] as {
            thenStmts: { type: string; parts: unknown[] }[];
            elseStmts: unknown[];
        };
        expect(ifStmt.thenStmts).toHaveLength(1);
        expect(ifStmt.thenStmts[0]?.type).toBe('PrintStmt');
        expect(ifStmt.thenStmts[0]?.parts).toEqual([
            { kind: 'expr', expr: { type: 'StringLit', value: 'A' } },
            { kind: 'sep', sep: ';' },
        ]);
        expect(ifStmt.elseStmts).toHaveLength(1);
    });

    it('parses the matrix.bas repro line: nested calls, trailing ";", ELSE, trailing ";"', (): void => {
        expect(() =>
            parseStatements(
                'IF RND(1) > 0.4 THEN PRINT CHR$(INT(RND(1) * 93) + 33); ELSE PRINT " ";',
            ),
        ).not.toThrow();
    });

    it('parses IF/THEN with a bare line number as a shorthand GOTO', (): void => {
        expect(parseStatements('IF X > 10 THEN 100')).toEqual([
            {
                type: 'IfStmt',
                condition: {
                    type: 'BinaryOp',
                    op: '>',
                    left: { type: 'VarRef', name: 'X', indices: null },
                    right: { type: 'NumberLit', value: 10 },
                },
                thenStmts: [{ type: 'GotoStmt', line: 100 }],
                elseStmts: null,
            },
        ]);
    });

    it('parses FOR/NEXT with an explicit STEP', (): void => {
        expect(parseStatements('FOR I = 1 TO 10 STEP 2')).toEqual([
            {
                type: 'ForStmt',
                varName: 'I',
                start: { type: 'NumberLit', value: 1 },
                end: { type: 'NumberLit', value: 10 },
                step: { type: 'NumberLit', value: 2 },
            },
        ]);
        expect(parseStatements('NEXT I')).toEqual([
            { type: 'NextStmt', varName: 'I' },
        ]);
        expect(parseStatements('NEXT')).toEqual([
            { type: 'NextStmt', varName: null },
        ]);
    });

    it('parses GOSUB/RETURN/GOTO/END', (): void => {
        expect(parseStatements('GOSUB 500')).toEqual([
            { type: 'GosubStmt', line: 500 },
        ]);
        expect(parseStatements('RETURN')).toEqual([{ type: 'ReturnStmt' }]);
        expect(parseStatements('GOTO 10')).toEqual([
            { type: 'GotoStmt', line: 10 },
        ]);
        expect(parseStatements('END')).toEqual([{ type: 'EndStmt' }]);
    });

    it('parses DIM', (): void => {
        expect(parseStatements('DIM A(10)')).toEqual([
            {
                type: 'DimStmt',
                name: 'A',
                size: { type: 'NumberLit', value: 10 },
            },
        ]);
    });

    it('parses COLOR with foreground only, both, and background-only forms', (): void => {
        expect(parseStatements('COLOR 10')).toEqual([
            {
                type: 'ColorStmt',
                fg: { type: 'NumberLit', value: 10 },
                bg: null,
            },
        ]);
        expect(parseStatements('COLOR 2, 0')).toEqual([
            {
                type: 'ColorStmt',
                fg: { type: 'NumberLit', value: 2 },
                bg: { type: 'NumberLit', value: 0 },
            },
        ]);
        expect(parseStatements('COLOR , 4')).toEqual([
            {
                type: 'ColorStmt',
                fg: null,
                bg: { type: 'NumberLit', value: 4 },
            },
        ]);
    });

    it('parses SLEEP with and without a duration', (): void => {
        expect(parseStatements('SLEEP')).toEqual([
            { type: 'SleepStmt', duration: null },
        ]);
        expect(parseStatements('SLEEP 0.05')).toEqual([
            {
                type: 'SleepStmt',
                duration: { type: 'NumberLit', value: 0.05 },
            },
        ]);
    });

    it('parses LOCATE row, col', (): void => {
        expect(parseStatements('LOCATE 5, 10')).toEqual([
            {
                type: 'LocateStmt',
                row: { type: 'NumberLit', value: 5 },
                col: { type: 'NumberLit', value: 10 },
            },
        ]);
        expect(parseStatements('LOCATE D(I), I + 1')).toEqual([
            {
                type: 'LocateStmt',
                row: {
                    type: 'VarRef',
                    name: 'D',
                    indices: [{ type: 'VarRef', name: 'I', indices: null }],
                },
                col: {
                    type: 'BinaryOp',
                    op: '+',
                    left: { type: 'VarRef', name: 'I', indices: null },
                    right: { type: 'NumberLit', value: 1 },
                },
            },
        ]);
    });

    it('LOCATE requires a comma between row and col', (): void => {
        expect(() => parseStatements('LOCATE 5 10')).toThrow(
            BasicSyntaxError,
        );
    });

    it('parses SCRWIDTH() and SCRHEIGHT() as zero-arg function calls', (): void => {
        expect(parseStatements('W = SCRWIDTH()')).toEqual([
            {
                type: 'LetStmt',
                name: 'W',
                indices: null,
                value: { type: 'FuncCall', name: 'SCRWIDTH', args: [] },
            },
        ]);
        expect(parseStatements('H = SCRHEIGHT()')).toEqual([
            {
                type: 'LetStmt',
                name: 'H',
                indices: null,
                value: { type: 'FuncCall', name: 'SCRHEIGHT', args: [] },
            },
        ]);
    });

    it('parses multiple colon-separated statements on one line', (): void => {
        const stmts = parseStatements('X = 1: Y = 2: PRINT X + Y');
        expect(stmts.map((s): string => s.type)).toEqual([
            'LetStmt',
            'LetStmt',
            'PrintStmt',
        ]);
    });

    it('respects operator precedence (^ before unary -, * before +)', (): void => {
        expect(parseStatements('X = 2 + 3 * 4')).toEqual([
            {
                type: 'LetStmt',
                name: 'X',
                indices: null,
                value: {
                    type: 'BinaryOp',
                    op: '+',
                    left: { type: 'NumberLit', value: 2 },
                    right: {
                        type: 'BinaryOp',
                        op: '*',
                        left: { type: 'NumberLit', value: 3 },
                        right: { type: 'NumberLit', value: 4 },
                    },
                },
            },
        ]);
    });

    it('parses function calls and distinguishes them from array indexing', (): void => {
        expect(parseStatements('X = LEN(A$)')).toEqual([
            {
                type: 'LetStmt',
                name: 'X',
                indices: null,
                value: {
                    type: 'FuncCall',
                    name: 'LEN',
                    args: [{ type: 'VarRef', name: 'A$', indices: null }],
                },
            },
        ]);
        expect(parseStatements('X = B(1)')).toEqual([
            {
                type: 'LetStmt',
                name: 'X',
                indices: null,
                value: {
                    type: 'VarRef',
                    name: 'B',
                    indices: [{ type: 'NumberLit', value: 1 }],
                },
            },
        ]);
    });

    it('ignores REM lines and blank lines', (): void => {
        expect(parseStatements('REM this is ignored')).toEqual([
            { type: 'RemStmt' },
        ]);
        expect(parseStatements('')).toEqual([]);
        expect(parseStatements('   ')).toEqual([]);
    });

    it('throws BasicSyntaxError on malformed input', (): void => {
        expect(() => parseStatements('PRINT +')).toThrow(BasicSyntaxError);
        expect(() => parseStatements('IF X = 1')).toThrow(BasicSyntaxError);
        expect(() => parseStatements('X = ')).toThrow(BasicSyntaxError);
    });
});
