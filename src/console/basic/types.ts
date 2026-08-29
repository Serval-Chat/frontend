export type BasicValue = number | string;

export interface NumberLit {
    type: 'NumberLit';
    value: number;
}

export interface StringLit {
    type: 'StringLit';
    value: string;
}

export interface VarRef {
    type: 'VarRef';
    name: string;
    indices: Expr[] | null;
}

export interface UnaryOp {
    type: 'UnaryOp';
    op: '-' | 'NOT';
    operand: Expr;
}

export interface BinaryOp {
    type: 'BinaryOp';
    op: string;
    left: Expr;
    right: Expr;
}

export interface FuncCall {
    type: 'FuncCall';
    name: string;
    args: Expr[];
}

export type Expr = NumberLit | StringLit | VarRef | UnaryOp | BinaryOp | FuncCall;

export type PrintPart =
    | { kind: 'expr'; expr: Expr }
    | { kind: 'sep'; sep: ',' | ';' };

export interface PrintStmt {
    type: 'PrintStmt';
    parts: PrintPart[];
}

export interface LetStmt {
    type: 'LetStmt';
    name: string;
    indices: Expr[] | null;
    value: Expr;
}

export interface InputStmt {
    type: 'InputStmt';
    prompt: Expr | null;
    vars: string[];
}

export interface IfStmt {
    type: 'IfStmt';
    condition: Expr;
    thenStmts: Stmt[];
    elseStmts: Stmt[] | null;
}

export interface ForStmt {
    type: 'ForStmt';
    varName: string;
    start: Expr;
    end: Expr;
    step: Expr | null;
}

export interface NextStmt {
    type: 'NextStmt';
    varName: string | null;
}

export interface GotoStmt {
    type: 'GotoStmt';
    line: number;
}

export interface GosubStmt {
    type: 'GosubStmt';
    line: number;
}

export interface ReturnStmt {
    type: 'ReturnStmt';
}

export interface EndStmt {
    type: 'EndStmt';
}

export interface DimStmt {
    type: 'DimStmt';
    name: string;
    size: Expr;
}

export interface ClsStmt {
    type: 'ClsStmt';
}

export interface ColorStmt {
    type: 'ColorStmt';
    fg: Expr | null;
    bg: Expr | null;
}

export interface RemStmt {
    type: 'RemStmt';
}

export interface SleepStmt {
    type: 'SleepStmt';
    duration: Expr | null;
}

export interface LocateStmt {
    type: 'LocateStmt';
    row: Expr;
    col: Expr;
}

export type Stmt =
    | PrintStmt
    | LetStmt
    | InputStmt
    | IfStmt
    | ForStmt
    | NextStmt
    | GotoStmt
    | GosubStmt
    | ReturnStmt
    | EndStmt
    | SleepStmt
    | LocateStmt
    | DimStmt
    | ClsStmt
    | ColorStmt
    | RemStmt;

export type TokenType =
    | 'NUMBER'
    | 'STRING'
    | 'IDENT'
    | 'OP'
    | 'EOL';

export interface Token {
    type: TokenType;
    text: string;
}

export class BasicSyntaxError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'BasicSyntaxError';
    }
}

export class BasicRuntimeError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'BasicRuntimeError';
    }
}

export class BasicBreak extends Error {
    public constructor() {
        super('Break');
        this.name = 'BasicBreak';
    }
}
