import { tokenize } from '@/console/basic/lexer';
import {
    BasicSyntaxError,
    type Expr,
    type PrintPart,
    type Stmt,
    type Token,
} from '@/console/basic/types';

const COMPARE_OPS = ['=', '<>', '<', '>', '<=', '>='];

class Parser {
    private pos = 0;

    public constructor(private readonly tokens: Token[]) {}

    private peek(): Token {
        return this.tokens[this.pos] as Token;
    }

    private advance(): Token {
        const token = this.tokens[this.pos] as Token;
        if (token.type !== 'EOL') this.pos++;
        return token;
    }

    private atEol(): boolean {
        return this.peek().type === 'EOL';
    }

    private isOp(text: string): boolean {
        const token = this.peek();
        return token.type === 'OP' && token.text === text;
    }

    private isKeyword(text: string): boolean {
        const token = this.peek();
        return token.type === 'IDENT' && token.text === text;
    }

    private expectOp(text: string): void {
        if (!this.isOp(text)) {
            throw new BasicSyntaxError(`Expected '${text}'`);
        }
        this.advance();
    }

    public parseLine(): Stmt[] {
        if (this.atEol()) return [];
        const stmts: Stmt[] = [this.parseStatement()];
        while (this.isOp(':')) {
            this.advance();
            stmts.push(this.parseStatement());
        }
        if (!this.atEol()) {
            throw new BasicSyntaxError('Syntax error');
        }
        return stmts;
    }

    private parseStatement(): Stmt {
        const token = this.peek();
        if (token.type !== 'IDENT') {
            return this.parseAssignmentOrError();
        }

        switch (token.text) {
            case 'PRINT': {
                this.advance();
                return this.parsePrint();
            }
            case 'LET': {
                this.advance();
                return this.parseAssignment();
            }
            case 'INPUT': {
                this.advance();
                return this.parseInput();
            }
            case 'IF': {
                this.advance();
                return this.parseIf();
            }
            case 'FOR': {
                this.advance();
                return this.parseFor();
            }
            case 'NEXT': {
                this.advance();
                return this.parseNext();
            }
            case 'GOTO': {
                this.advance();
                return { type: 'GotoStmt', line: this.parseLineNumber() };
            }
            case 'GOSUB': {
                this.advance();
                return { type: 'GosubStmt', line: this.parseLineNumber() };
            }
            case 'RETURN': {
                this.advance();
                return { type: 'ReturnStmt' };
            }
            case 'END': {
                this.advance();
                return { type: 'EndStmt' };
            }
            case 'DIM': {
                this.advance();
                return this.parseDim();
            }
            case 'CLS': {
                this.advance();
                return { type: 'ClsStmt' };
            }
            case 'COLOR': {
                this.advance();
                return this.parseColor();
            }
            case 'SLEEP': {
                this.advance();
                return this.parseSleep();
            }
            case 'LOCATE': {
                this.advance();
                return this.parseLocate();
            }
            case 'REM': {
                this.advance();
                return { type: 'RemStmt' };
            }
            default: {
                return this.parseAssignmentOrError();
            }
        }
    }

    private parseAssignmentOrError(): Stmt {
        if (this.peek().type === 'IDENT') {
            return this.parseAssignment();
        }
        throw new BasicSyntaxError('Syntax error');
    }

    private parseLineNumber(): number {
        const token = this.peek();
        if (token.type !== 'NUMBER') {
            throw new BasicSyntaxError('Expected line number');
        }
        this.advance();
        return Number(token.text);
    }

    private atStatementEnd(): boolean {
        return this.atEol() || this.isOp(':') || this.isKeyword('ELSE');
    }

    private parsePrint(): Stmt {
        const parts: PrintPart[] = [];
        if (this.atStatementEnd()) {
            return { type: 'PrintStmt', parts };
        }
        parts.push({ kind: 'expr', expr: this.parseOr() });
        while (this.isOp(',') || this.isOp(';')) {
            const sep = this.advance().text as ',' | ';';
            parts.push({ kind: 'sep', sep });
            if (!this.atStatementEnd()) {
                parts.push({ kind: 'expr', expr: this.parseOr() });
            }
        }
        return { type: 'PrintStmt', parts };
    }

    private parseAssignment(): Stmt {
        const name = this.parseIdentName();
        const indices = this.tryParseIndices();
        this.expectOp('=');
        const value = this.parseOr();
        return { type: 'LetStmt', name, indices, value };
    }

    private parseIdentName(): string {
        const token = this.peek();
        if (token.type !== 'IDENT') {
            throw new BasicSyntaxError('Expected identifier');
        }
        this.advance();
        return token.text;
    }

    private tryParseIndices(): Expr[] | null {
        if (!this.isOp('(')) return null;
        this.advance();
        const indices: Expr[] = [this.parseOr()];
        while (this.isOp(',')) {
            this.advance();
            indices.push(this.parseOr());
        }
        this.expectOp(')');
        return indices;
    }

    private parseInput(): Stmt {
        let prompt: Expr | null = null;
        if (this.peek().type === 'STRING') {
            prompt = { type: 'StringLit', value: this.advance().text };
            if (this.isOp(';') || this.isOp(',')) {
                this.advance();
            }
        }
        const vars: string[] = [this.parseIdentName()];
        while (this.isOp(',')) {
            this.advance();
            vars.push(this.parseIdentName());
        }
        return { type: 'InputStmt', prompt, vars };
    }

    private parseIf(): Stmt {
        const condition = this.parseOr();
        if (!this.isKeyword('THEN')) {
            throw new BasicSyntaxError("Expected 'THEN'");
        }
        this.advance();

        let thenStmts: Stmt[];
        if (this.peek().type === 'NUMBER') {
            thenStmts = [{ type: 'GotoStmt', line: this.parseLineNumber() }];
        } else {
            thenStmts = this.parseStatementList();
        }

        let elseStmts: Stmt[] | null = null;
        if (this.isKeyword('ELSE')) {
            this.advance();
            elseStmts =
                this.peek().type === 'NUMBER'
                    ? [{ type: 'GotoStmt', line: this.parseLineNumber() }]
                    : this.parseStatementList();
        }

        return { type: 'IfStmt', condition, thenStmts, elseStmts };
    }

    private parseStatementList(): Stmt[] {
        const stmts = [this.parseStatement()];
        while (this.isOp(':') && !this.isKeyword('ELSE')) {
            this.advance();
            if (this.isKeyword('ELSE')) break;
            stmts.push(this.parseStatement());
        }
        return stmts;
    }

    private parseFor(): Stmt {
        const varName = this.parseIdentName();
        this.expectOp('=');
        const start = this.parseOr();
        if (!this.isKeyword('TO')) {
            throw new BasicSyntaxError("Expected 'TO'");
        }
        this.advance();
        const end = this.parseOr();
        let step: Expr | null = null;
        if (this.isKeyword('STEP')) {
            this.advance();
            step = this.parseOr();
        }
        return { type: 'ForStmt', varName, start, end, step };
    }

    private parseNext(): Stmt {
        if (this.peek().type === 'IDENT') {
            return { type: 'NextStmt', varName: this.parseIdentName() };
        }
        return { type: 'NextStmt', varName: null };
    }

    private parseDim(): Stmt {
        const name = this.parseIdentName();
        this.expectOp('(');
        const size = this.parseOr();
        this.expectOp(')');
        return { type: 'DimStmt', name, size };
    }

    private parseColor(): Stmt {
        let fg: Expr | null = null;
        let bg: Expr | null = null;

        if (!this.atStatementEnd() && !this.isOp(',')) {
            fg = this.parseOr();
        }
        if (this.isOp(',')) {
            this.advance();
            if (!this.atStatementEnd()) {
                bg = this.parseOr();
            }
        }

        return { type: 'ColorStmt', fg, bg };
    }

    private parseSleep(): Stmt {
        if (this.atStatementEnd()) {
            return { type: 'SleepStmt', duration: null };
        }
        return { type: 'SleepStmt', duration: this.parseOr() };
    }

    private parseLocate(): Stmt {
        const row = this.parseOr();
        this.expectOp(',');
        const col = this.parseOr();
        return { type: 'LocateStmt', row, col };
    }

    private parseOr(): Expr {
        let left = this.parseAnd();
        while (this.isKeyword('OR')) {
            this.advance();
            left = { type: 'BinaryOp', op: 'OR', left, right: this.parseAnd() };
        }
        return left;
    }

    private parseAnd(): Expr {
        let left = this.parseNot();
        while (this.isKeyword('AND')) {
            this.advance();
            left = {
                type: 'BinaryOp',
                op: 'AND',
                left,
                right: this.parseNot(),
            };
        }
        return left;
    }

    private parseNot(): Expr {
        if (this.isKeyword('NOT')) {
            this.advance();
            return { type: 'UnaryOp', op: 'NOT', operand: this.parseNot() };
        }
        return this.parseCompare();
    }

    private parseCompare(): Expr {
        let left = this.parseAdd();
        while (this.peek().type === 'OP' && COMPARE_OPS.includes(this.peek().text)) {
            const op = this.advance().text;
            left = { type: 'BinaryOp', op, left, right: this.parseAdd() };
        }
        return left;
    }

    private parseAdd(): Expr {
        let left = this.parseMul();
        while (this.isOp('+') || this.isOp('-')) {
            const op = this.advance().text;
            left = { type: 'BinaryOp', op, left, right: this.parseMul() };
        }
        return left;
    }

    private parseMul(): Expr {
        let left = this.parseUnary();
        while (this.isOp('*') || this.isOp('/') || this.isKeyword('MOD')) {
            const op = this.advance().text;
            left = { type: 'BinaryOp', op, left, right: this.parseUnary() };
        }
        return left;
    }

    private parseUnary(): Expr {
        if (this.isOp('-')) {
            this.advance();
            return { type: 'UnaryOp', op: '-', operand: this.parseUnary() };
        }
        return this.parsePow();
    }

    private parsePow(): Expr {
        const base = this.parsePrimary();
        if (this.isOp('^')) {
            this.advance();
            return {
                type: 'BinaryOp',
                op: '^',
                left: base,
                right: this.parseUnary(),
            };
        }
        return base;
    }

    private parsePrimary(): Expr {
        const token = this.peek();

        if (token.type === 'NUMBER') {
            this.advance();
            return { type: 'NumberLit', value: Number(token.text) };
        }

        if (token.type === 'STRING') {
            this.advance();
            return { type: 'StringLit', value: token.text };
        }

        if (this.isOp('(')) {
            this.advance();
            const expr = this.parseOr();
            this.expectOp(')');
            return expr;
        }

        if (token.type === 'IDENT') {
            this.advance();
            if (this.isOp('(')) {
                this.advance();
                const args: Expr[] = [];
                if (!this.isOp(')')) {
                    args.push(this.parseOr());
                    while (this.isOp(',')) {
                        this.advance();
                        args.push(this.parseOr());
                    }
                }
                this.expectOp(')');
                if (isKnownFunction(token.text)) {
                    return { type: 'FuncCall', name: token.text, args };
                }
                return { type: 'VarRef', name: token.text, indices: args };
            }
            return { type: 'VarRef', name: token.text, indices: null };
        }

        throw new BasicSyntaxError('Syntax error');
    }
}

const KNOWN_FUNCTIONS = new Set([
    'ABS',
    'INT',
    'RND',
    'SQR',
    'LEN',
    'LEFT$',
    'RIGHT$',
    'MID$',
    'STR$',
    'VAL',
    'CHR$',
    'ASC',
    'SCRWIDTH',
    'SCRHEIGHT',
]);

function isKnownFunction(name: string): boolean {
    return KNOWN_FUNCTIONS.has(name);
}

export function parseStatements(source: string): Stmt[] {
    return new Parser(tokenize(source)).parseLine();
}
