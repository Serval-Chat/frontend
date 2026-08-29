import type { BasicIo } from '@/console/basic/BasicInterpreter';
import { BasicInterpreter } from '@/console/basic/BasicInterpreter';
import { parseStatements } from '@/console/basic/parser';
import type {
    ConsoleKeyEvent,
    ConsoleProgram,
} from '@/console/ConCommandRegistry';
import type { DosFileSystem } from '@/console/DosFileSystem';
import type { Terminal } from '@/console/Terminal';

const errorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

export class BasicProgram implements ConsoleProgram {
    private readonly terminal: Terminal;
    private readonly filesystem: DosFileSystem;
    private readonly onExit: () => void;
    private readonly interpreter = new BasicInterpreter();
    private readonly io: BasicIo;

    private started = false;
    private running = false;
    private inputBuffer = '';
    private awaitingProgramInput: ((value: string) => void) | null = null;

    public constructor(options: {
        terminal: Terminal;
        filesystem: DosFileSystem;
        onExit: () => void;
        initialFile?: string;
    }) {
        this.terminal = options.terminal;
        this.filesystem = options.filesystem;
        this.onExit = options.onExit;

        this.io = {
            print: (text: string): void => {
                this.terminal.write(text);
            },
            input: (prompt: string): Promise<string> => {
                this.terminal.write(prompt);
                return new Promise<string>((resolve): void => {
                    this.awaitingProgramInput = resolve;
                });
            },
            getScreenSize: (): { columns: number; rows: number } =>
                this.terminal.getSize(),
        };

        if (options.initialFile) {
            try {
                this.interpreter.loadProgram(
                    this.filesystem.readFile(options.initialFile),
                );
            } catch {
                this.interpreter.clearProgram();
            }
        }
    }

    public start(): void {
        if (this.started) return;
        this.started = true;
        this.terminal.puts('Serchat BASIC 1.0');
        this.terminal.puts('(C) Copyright 1985-1996 Serchat Corp.');
        this.terminal.puts('');
        this.terminal.puts(
            this.interpreter.isEmpty() ? 'Ok' : 'Loaded.\nOk',
        );
    }

    public handleKeyDown(event: ConsoleKeyEvent): void {
        event.preventDefault();

        if (event.ctrlKey && event.key.toLowerCase() === 'c') {
            if (this.running) {
                this.interpreter.requestStop();
            }
            return;
        }

        if (this.awaitingProgramInput) {
            this.handleLineBufferedKey(event, (line): void => {
                const resolve = this.awaitingProgramInput;
                this.awaitingProgramInput = null;
                resolve?.(line);
            });
            return;
        }

        if (this.running) {
            return;
        }

        this.handleLineBufferedKey(event, (line): void => {
            void this.executeImmediateLine(line);
        });
    }

    private handleLineBufferedKey(
        event: ConsoleKeyEvent,
        onEnter: (line: string) => void,
    ): void {
        switch (event.key) {
            case 'Enter': {
                const line = this.inputBuffer;
                this.inputBuffer = '';
                this.terminal.write('\n');
                onEnter(line);
                return;
            }
            case 'Backspace': {
                if (this.inputBuffer.length > 0) {
                    this.inputBuffer = this.inputBuffer.slice(0, -1);
                    this.terminal.write('\b');
                }
                return;
            }
            default: {
                if (
                    event.key.length === 1 &&
                    !event.ctrlKey &&
                    !event.altKey
                ) {
                    this.inputBuffer += event.key;
                    this.terminal.write(event.key);
                }
            }
        }
    }

    private async executeImmediateLine(line: string): Promise<void> {
        const trimmed = line.trim();
        if (!trimmed) {
            this.terminal.puts('Ok');
            return;
        }

        const lineMatch = /^(\d+)\s*(.*)$/.exec(trimmed);
        if (lineMatch) {
            try {
                this.interpreter.setLine(
                    Number(lineMatch[1]),
                    lineMatch[2] ?? '',
                );
            } catch (error) {
                this.terminal.puts(`?${errorMessage(error)}`);
            }
            this.terminal.puts('Ok');
            return;
        }

        const upper = trimmed.toUpperCase();

        if (upper === 'SYSTEM' || upper === 'EXIT') {
            this.terminal.resetCursorPositioning();
            this.onExit();
            return;
        }

        if (upper === 'RUN') {
            await this.runProgram();
            this.terminal.puts('Ok');
            return;
        }

        if (upper === 'LIST') {
            for (const sourceLine of this.interpreter.listProgram()) {
                this.terminal.puts(sourceLine);
            }
            this.terminal.puts('Ok');
            return;
        }

        if (upper === 'NEW') {
            this.interpreter.clearProgram();
            this.terminal.puts('Ok');
            return;
        }

        if (/^SAVE\s+/i.test(trimmed)) {
            const path = trimmed.slice(trimmed.indexOf(' ') + 1).trim();
            try {
                this.filesystem.writeFile(
                    path,
                    this.interpreter.getProgramSource(),
                );
                this.terminal.puts('Saved.');
            } catch (error) {
                this.terminal.puts(`?${errorMessage(error)}`);
            }
            this.terminal.puts('Ok');
            return;
        }

        if (/^LOAD\s+/i.test(trimmed)) {
            const path = trimmed.slice(trimmed.indexOf(' ') + 1).trim();
            try {
                this.interpreter.loadProgram(this.filesystem.readFile(path));
                this.terminal.puts('Loaded.');
            } catch (error) {
                this.terminal.puts(`?${errorMessage(error)}`);
            }
            this.terminal.puts('Ok');
            return;
        }

        try {
            const stmts = parseStatements(trimmed);
            this.running = true;
            await this.interpreter.runImmediate(stmts, this.io);
        } catch (error) {
            this.terminal.puts(`?${errorMessage(error)}`);
        } finally {
            this.running = false;
        }
        this.terminal.puts('Ok');
    }

    private async runProgram(): Promise<void> {
        this.running = true;
        try {
            await this.interpreter.run(this.io);
        } finally {
            this.running = false;
        }
    }
}
