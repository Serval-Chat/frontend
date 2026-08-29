import { parseStatements } from '@/console/basic/parser';
import {
    BasicBreak,
    BasicRuntimeError,
    BasicSyntaxError,
    type BasicValue,
    type Expr,
    type PrintPart,
    type Stmt,
    type VarRef,
} from '@/console/basic/types';

export interface BasicIo {
    print: (text: string) => void;
    input: (prompt: string) => Promise<string>;
    getScreenSize?: () => { columns: number; rows: number };
}

const DEFAULT_SCREEN_SIZE = { columns: 80, rows: 25 };
const SLEEP_CHUNK_MS = 50;

interface Position {
    lineIndex: number;
    stmtIndex: number;
}

interface ForFrame {
    varName: string;
    end: number;
    step: number;
    bodyStart: Position;
}

type Signal = { type: 'jump'; pos: Position } | { type: 'end' };

const COMPARE_OPS = new Set(['=', '<>', '<', '>', '<=', '>=']);
const PRINT_ZONE_WIDTH = 14;
const YIELD_EVERY_N_STEPS = 200;
const ESC = String.fromCharCode(27);

const CGA_FG_ANSI = [
    30, 34, 32, 36, 31, 35, 33, 37, 90, 94, 92, 96, 91, 95, 93, 97,
];
const CGA_BG_ANSI = [40, 44, 42, 46, 41, 45, 43, 47];

export class BasicInterpreter {
    private lines = new Map<number, { source: string; stmts: Stmt[] }>();
    private variables = new Map<string, BasicValue>();
    private arrays = new Map<string, BasicValue[]>();
    private forStack: ForFrame[] = [];
    private gosubStack: Position[] = [];
    private printColumn = 0;
    private stopRequested = false;
    private stepCount = 0;
    private screenColumns = DEFAULT_SCREEN_SIZE.columns;
    private screenRows = DEFAULT_SCREEN_SIZE.rows;

    public setLine(lineNumber: number, statementText: string): void {
        const trimmed = statementText.trim();
        if (!trimmed) {
            this.lines.delete(lineNumber);
            return;
        }
        const stmts = parseStatements(trimmed);
        this.lines.set(lineNumber, { source: trimmed, stmts });
    }

    public deleteLine(lineNumber: number): boolean {
        return this.lines.delete(lineNumber);
    }

    public clearProgram(): void {
        this.lines.clear();
        this.variables.clear();
        this.arrays.clear();
    }

    public isEmpty(): boolean {
        return this.lines.size === 0;
    }

    public listProgram(): string[] {
        return this.getSortedLineNumbers().map((lineNumber): string => {
            const entry = this.lines.get(lineNumber);
            return `${lineNumber} ${entry?.source ?? ''}`;
        });
    }

    public getProgramSource(): string {
        return this.listProgram().join('\n');
    }

    public loadProgram(source: string): void {
        this.clearProgram();
        for (const rawLine of source.split('\n')) {
            const line = rawLine.trim();
            if (!line) continue;
            const match = /^(\d+)\s*(.*)$/.exec(line);
            if (!match) {
                throw new BasicSyntaxError(`Invalid program line: ${line}`);
            }
            this.setLine(Number(match[1]), match[2] ?? '');
        }
    }

    public requestStop(): void {
        this.stopRequested = true;
    }

    public async run(io: BasicIo): Promise<void> {
        this.variables.clear();
        this.arrays.clear();
        this.forStack = [];
        this.gosubStack = [];
        this.printColumn = 0;
        this.stopRequested = false;
        this.stepCount = 0;
        this.syncScreenSize(io);
        await this.executeFrom({ lineIndex: 0, stmtIndex: 0 }, io);
    }

    public async runImmediate(stmts: Stmt[], io: BasicIo): Promise<void> {
        this.stopRequested = false;
        this.syncScreenSize(io);
        const order = this.getSortedLineNumbers();
        const endPos: Position = { lineIndex: order.length, stmtIndex: 0 };

        try {
            for (const stmt of stmts) {
                const result = await this.execStmt(stmt, io, 0, endPos);
                if (result?.type === 'jump') {
                    await this.executeFrom(result.pos, io);
                    return;
                }
                if (result?.type === 'end') return;
            }
        } catch (error) {
            this.reportError(error, io, 0);
        }
    }

    private getSortedLineNumbers(): number[] {
        return [...this.lines.keys()].sort((a, b): number => a - b);
    }

    private syncScreenSize(io: BasicIo): void {
        const size = io.getScreenSize?.() ?? DEFAULT_SCREEN_SIZE;
        this.screenColumns = size.columns;
        this.screenRows = size.rows;
    }

    private async sleepSeconds(seconds: number): Promise<void> {
        let remainingMs = Math.max(0, seconds) * 1000;
        while (remainingMs > 0) {
            if (this.stopRequested) {
                throw new BasicBreak();
            }
            const chunk = Math.min(SLEEP_CHUNK_MS, remainingMs);
            await new Promise<void>((resolve): void => {
                setTimeout(resolve, chunk);
            });
            remainingMs -= chunk;
        }
        if (this.stopRequested) {
            throw new BasicBreak();
        }
    }

    private findLineIndex(lineNumber: number): number {
        const idx = this.getSortedLineNumbers().indexOf(lineNumber);
        if (idx < 0) {
            throw new BasicRuntimeError('UNDEFINED LINE NUMBER');
        }
        return idx;
    }

    private async executeFrom(start: Position, io: BasicIo): Promise<void> {
        const order = this.getSortedLineNumbers();
        let { lineIndex, stmtIndex } = start;
        let currentLineNumber = order[lineIndex] ?? 0;

        try {
            while (lineIndex < order.length) {
                const lineNumber = order[lineIndex] as number;
                currentLineNumber = lineNumber;
                const entry = this.lines.get(lineNumber);
                if (!entry || stmtIndex >= entry.stmts.length) {
                    lineIndex++;
                    stmtIndex = 0;
                    continue;
                }

                this.stepCount++;
                if (this.stepCount % YIELD_EVERY_N_STEPS === 0) {
                    await new Promise<void>((resolve): void => {
                        setTimeout(resolve, 0);
                    });
                }
                if (this.stopRequested) {
                    throw new BasicBreak();
                }

                const stmt = entry.stmts[stmtIndex] as Stmt;
                const nextPos: Position = { lineIndex, stmtIndex: stmtIndex + 1 };
                const result = await this.execStmt(
                    stmt,
                    io,
                    lineNumber,
                    nextPos,
                );

                if (result?.type === 'jump') {
                    lineIndex = result.pos.lineIndex;
                    stmtIndex = result.pos.stmtIndex;
                    continue;
                }
                if (result?.type === 'end') return;
                stmtIndex++;
            }
        } catch (error) {
            this.reportError(error, io, currentLineNumber);
        }
    }

    private reportError(error: unknown, io: BasicIo, lineNumber: number): void {
        if (this.printColumn !== 0) {
            io.print('\n');
            this.printColumn = 0;
        }
        if (error instanceof BasicBreak) {
            io.print(`Break in ${lineNumber}\n`);
            return;
        }
        if (
            error instanceof BasicRuntimeError ||
            error instanceof BasicSyntaxError
        ) {
            io.print(`?${error.message} IN ${lineNumber}\n`);
            return;
        }
        throw error;
    }

    private async execStmt(
        stmt: Stmt,
        io: BasicIo,
        lineNumber: number,
        nextPos: Position,
    ): Promise<Signal | undefined> {
        switch (stmt.type) {
            case 'PrintStmt': {
                this.execPrint(stmt.parts, io);
                return undefined;
            }
            case 'LetStmt': {
                const value = this.coerceToVarType(
                    stmt.name,
                    this.evalExpr(stmt.value),
                );
                if (stmt.indices) {
                    this.setArrayElement(stmt.name, stmt.indices, value);
                } else {
                    this.variables.set(stmt.name, value);
                }
                return undefined;
            }
            case 'InputStmt': {
                await this.execInput(stmt.prompt, stmt.vars, io);
                return undefined;
            }
            case 'IfStmt': {
                const truthy = this.asNumber(this.evalExpr(stmt.condition)) !== 0;
                const branch = truthy ? stmt.thenStmts : stmt.elseStmts;
                if (!branch) return undefined;
                for (const inner of branch) {
                    const result = await this.execStmt(
                        inner,
                        io,
                        lineNumber,
                        nextPos,
                    );
                    if (result) return result;
                }
                return undefined;
            }
            case 'ForStmt': {
                const start = this.asNumber(this.evalExpr(stmt.start));
                const end = this.asNumber(this.evalExpr(stmt.end));
                const step = stmt.step
                    ? this.asNumber(this.evalExpr(stmt.step))
                    : 1;
                this.variables.set(stmt.varName, start);
                this.forStack.push({
                    varName: stmt.varName,
                    end,
                    step,
                    bodyStart: nextPos,
                });
                return undefined;
            }
            case 'NextStmt': {
                return this.execNext(stmt.varName);
            }
            case 'GotoStmt': {
                return {
                    type: 'jump',
                    pos: { lineIndex: this.findLineIndex(stmt.line), stmtIndex: 0 },
                };
            }
            case 'GosubStmt': {
                this.gosubStack.push(nextPos);
                return {
                    type: 'jump',
                    pos: { lineIndex: this.findLineIndex(stmt.line), stmtIndex: 0 },
                };
            }
            case 'ReturnStmt': {
                const pos = this.gosubStack.pop();
                if (!pos) {
                    throw new BasicRuntimeError('RETURN WITHOUT GOSUB');
                }
                return { type: 'jump', pos };
            }
            case 'EndStmt': {
                return { type: 'end' };
            }
            case 'DimStmt': {
                const size = Math.trunc(this.asNumber(this.evalExpr(stmt.size)));
                this.arrays.set(
                    stmt.name,
                    new Array(size + 1).fill(
                        stmt.name.endsWith('$') ? '' : 0,
                    ) as BasicValue[],
                );
                return undefined;
            }
            case 'ClsStmt': {
                io.print(`${ESC}[2J${ESC}[H`);
                this.printColumn = 0;
                return undefined;
            }
            case 'ColorStmt': {
                this.execColor(stmt.fg, stmt.bg, io);
                return undefined;
            }
            case 'SleepStmt': {
                const seconds = stmt.duration
                    ? this.asNumber(this.evalExpr(stmt.duration))
                    : 1;
                await this.sleepSeconds(seconds);
                return undefined;
            }
            case 'LocateStmt': {
                const row = Math.trunc(this.asNumber(this.evalExpr(stmt.row)));
                const col = Math.trunc(this.asNumber(this.evalExpr(stmt.col)));
                if (row < 1 || col < 1) {
                    throw new BasicRuntimeError('ILLEGAL FUNCTION CALL');
                }
                io.print(`${ESC}[${row};${col}H`);
                this.printColumn = col - 1;
                return undefined;
            }
            case 'RemStmt': {
                return undefined;
            }
        }
    }

    private execPrint(parts: PrintPart[], io: BasicIo): void {
        let endsWithSep = false;
        for (const part of parts) {
            if (part.kind === 'sep') {
                endsWithSep = true;
                if (part.sep === ',') {
                    const next =
                        (Math.floor(this.printColumn / PRINT_ZONE_WIDTH) + 1) *
                        PRINT_ZONE_WIDTH;
                    const pad = ' '.repeat(next - this.printColumn);
                    io.print(pad);
                    this.printColumn = next;
                }
            } else {
                endsWithSep = false;
                const value = this.evalExpr(part.expr);
                const text =
                    typeof value === 'number'
                        ? this.formatPrintedNumber(value)
                        : value;
                io.print(text);
                this.printColumn += text.length;
            }
        }
        if (!endsWithSep) {
            io.print('\n');
            this.printColumn = 0;
        }
    }

    private execColor(fg: Expr | null, bg: Expr | null, io: BasicIo): void {
        const codes: number[] = [];

        if (fg) {
            const value = Math.trunc(this.asNumber(this.evalExpr(fg)));
            if (value < 0 || value > 15) {
                throw new BasicRuntimeError('ILLEGAL FUNCTION CALL');
            }
            codes.push(CGA_FG_ANSI[value] as number);
        }
        if (bg) {
            const value = Math.trunc(this.asNumber(this.evalExpr(bg)));
            if (value < 0 || value > 7) {
                throw new BasicRuntimeError('ILLEGAL FUNCTION CALL');
            }
            codes.push(CGA_BG_ANSI[value] as number);
        }

        if (codes.length > 0) {
            io.print(`${ESC}[${codes.join(';')}m`);
        }
    }

    private async execInput(
        prompt: Expr | null,
        vars: string[],
        io: BasicIo,
    ): Promise<void> {
        const promptValue = prompt ? this.evalExpr(prompt) : '';
        const promptText = `${typeof promptValue === 'string' ? promptValue : String(promptValue)}? `;
        const raw = await io.input(promptText);
        this.printColumn = 0;

        const rawParts = raw.split(',').map((part): string => part.trim());
        vars.forEach((name, i): void => {
            const rawValue = rawParts[i] ?? '';
            if (name.endsWith('$')) {
                this.variables.set(name, rawValue);
                return;
            }
            const parsed = Number.parseFloat(rawValue);
            this.variables.set(name, Number.isNaN(parsed) ? 0 : parsed);
        });
    }

    private execNext(varName: string | null): Signal | undefined {
        const idx = varName
            ? this.forStack.findLastIndex((f): boolean => f.varName === varName)
            : this.forStack.length - 1;
        if (idx < 0) {
            throw new BasicRuntimeError('NEXT WITHOUT FOR');
        }
        const loop = this.forStack[idx] as ForFrame;
        const current = this.asNumber(this.variables.get(loop.varName) ?? 0);
        const next = current + loop.step;
        this.variables.set(loop.varName, next);

        const continues =
            loop.step >= 0 ? next <= loop.end : next >= loop.end;
        if (continues) {
            return { type: 'jump', pos: loop.bodyStart };
        }
        this.forStack.splice(idx, 1);
        return undefined;
    }

    private evalExpr(expr: Expr): BasicValue {
        switch (expr.type) {
            case 'NumberLit': {
                return expr.value;
            }
            case 'StringLit': {
                return expr.value;
            }
            case 'VarRef': {
                return this.evalVarRef(expr);
            }
            case 'UnaryOp': {
                if (expr.op === 'NOT') {
                    return this.asNumber(this.evalExpr(expr.operand)) === 0
                        ? -1
                        : 0;
                }
                return -this.asNumber(this.evalExpr(expr.operand));
            }
            case 'BinaryOp': {
                return this.evalBinary(expr.op, expr.left, expr.right);
            }
            case 'FuncCall': {
                return this.evalFunc(
                    expr.name,
                    expr.args.map((a): BasicValue => this.evalExpr(a)),
                );
            }
        }
    }

    private evalVarRef(expr: VarRef): BasicValue {
        if (!expr.indices) {
            const existing = this.variables.get(expr.name);
            if (existing !== undefined) return existing;
            return expr.name.endsWith('$') ? '' : 0;
        }
        const idx = Math.trunc(
            this.asNumber(this.evalExpr(expr.indices[0] as Expr)),
        );
        const arr = this.getArray(expr.name);
        if (idx < 0 || idx >= arr.length) {
            throw new BasicRuntimeError('SUBSCRIPT OUT OF RANGE');
        }
        return arr[idx] as BasicValue;
    }

    private setArrayElement(
        name: string,
        indices: Expr[],
        value: BasicValue,
    ): void {
        const idx = Math.trunc(
            this.asNumber(this.evalExpr(indices[0] as Expr)),
        );
        const arr = this.getArray(name);
        if (idx < 0 || idx >= arr.length) {
            throw new BasicRuntimeError('SUBSCRIPT OUT OF RANGE');
        }
        arr[idx] = value;
    }

    private getArray(name: string): BasicValue[] {
        let arr = this.arrays.get(name);
        if (!arr) {
            arr = new Array(11).fill(name.endsWith('$') ? '' : 0) as BasicValue[];
            this.arrays.set(name, arr);
        }
        return arr;
    }

    private evalBinary(op: string, leftExpr: Expr, rightExpr: Expr): BasicValue {
        if (op === 'AND' || op === 'OR') {
            const left = this.asNumber(this.evalExpr(leftExpr)) !== 0;
            const right = this.asNumber(this.evalExpr(rightExpr)) !== 0;
            const result = op === 'AND' ? left && right : left || right;
            return result ? -1 : 0;
        }

        const left = this.evalExpr(leftExpr);
        const right = this.evalExpr(rightExpr);

        if (COMPARE_OPS.has(op)) {
            return this.compare(op, left, right) ? -1 : 0;
        }

        if (op === '+' && typeof left === 'string' && typeof right === 'string') {
            return left + right;
        }

        const l = this.asNumber(left);
        const r = this.asNumber(right);
        switch (op) {
            case '+': {
                return l + r;
            }
            case '-': {
                return l - r;
            }
            case '*': {
                return l * r;
            }
            case '/': {
                if (r === 0) throw new BasicRuntimeError('DIVISION BY ZERO');
                return l / r;
            }
            case '^': {
                return l ** r;
            }
            case 'MOD': {
                if (r === 0) throw new BasicRuntimeError('DIVISION BY ZERO');
                return l % r;
            }
            default: {
                throw new BasicRuntimeError('SYNTAX ERROR');
            }
        }
    }

    private compare(op: string, left: BasicValue, right: BasicValue): boolean {
        if (typeof left !== typeof right) {
            throw new BasicRuntimeError('TYPE MISMATCH');
        }
        switch (op) {
            case '=': {
                return left === right;
            }
            case '<>': {
                return left !== right;
            }
            case '<': {
                return left < right;
            }
            case '>': {
                return left > right;
            }
            case '<=': {
                return left <= right;
            }
            case '>=': {
                return left >= right;
            }
            default: {
                throw new BasicRuntimeError('SYNTAX ERROR');
            }
        }
    }

    private evalFunc(name: string, args: BasicValue[]): BasicValue {
        switch (name) {
            case 'ABS': {
                return Math.abs(this.numArg(args, 0));
            }
            case 'INT': {
                return Math.floor(this.numArg(args, 0));
            }
            case 'RND': {
                return Math.random();
            }
            case 'SQR': {
                const n = this.numArg(args, 0);
                if (n < 0) {
                    throw new BasicRuntimeError('ILLEGAL FUNCTION CALL');
                }
                return Math.sqrt(n);
            }
            case 'LEN': {
                return this.strArg(args, 0).length;
            }
            case 'LEFT$': {
                return this.strArg(args, 0).slice(0, this.numArg(args, 1));
            }
            case 'RIGHT$': {
                const s = this.strArg(args, 0);
                const n = this.numArg(args, 1);
                return n <= 0 ? '' : s.slice(-n);
            }
            case 'MID$': {
                const s = this.strArg(args, 0);
                const from = Math.max(0, this.numArg(args, 1) - 1);
                if (args.length > 2) {
                    return s.slice(from, from + this.numArg(args, 2));
                }
                return s.slice(from);
            }
            case 'STR$': {
                return this.formatNumber(this.numArg(args, 0));
            }
            case 'VAL': {
                const n = Number.parseFloat(this.strArg(args, 0));
                return Number.isNaN(n) ? 0 : n;
            }
            case 'CHR$': {
                return String.fromCharCode(this.numArg(args, 0));
            }
            case 'ASC': {
                const s = this.strArg(args, 0);
                if (s.length === 0) {
                    throw new BasicRuntimeError('ILLEGAL FUNCTION CALL');
                }
                return s.charCodeAt(0);
            }
            case 'SCRWIDTH': {
                return this.screenColumns;
            }
            case 'SCRHEIGHT': {
                return this.screenRows;
            }
            default: {
                throw new BasicRuntimeError('SYNTAX ERROR');
            }
        }
    }

    private numArg(args: BasicValue[], i: number): number {
        return this.asNumber(args[i] as BasicValue);
    }

    private strArg(args: BasicValue[], i: number): string {
        return this.asString(args[i] as BasicValue);
    }

    private asNumber(value: BasicValue): number {
        if (typeof value !== 'number') {
            throw new BasicRuntimeError('TYPE MISMATCH');
        }
        return value;
    }

    private asString(value: BasicValue): string {
        if (typeof value !== 'string') {
            throw new BasicRuntimeError('TYPE MISMATCH');
        }
        return value;
    }

    private coerceToVarType(name: string, value: BasicValue): BasicValue {
        return name.endsWith('$')
            ? this.asString(value)
            : this.asNumber(value);
    }

    private formatNumber(n: number): string {
        if (Number.isInteger(n)) return String(n);
        let s = n.toPrecision(10);
        if (s.includes('.')) {
            s = s.replace(/0+$/, '').replace(/\.$/, '');
        }
        return s;
    }

    private formatPrintedNumber(n: number): string {
        const s = this.formatNumber(n);
        return n < 0 ? s : ` ${s}`;
    }
}
