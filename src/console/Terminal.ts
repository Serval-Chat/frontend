export interface TerminalSize {
    columns: number;
    rows: number;
}

export interface TerminalLine {
    id: string;
    text: string;
}

type TerminalChangeListener = (lines: TerminalLine[]) => void;

const DEFAULT_SIZE: TerminalSize = {
    columns: 80,
    rows: 25,
};

const ESCAPE_SEQUENCE = String.fromCharCode(27);
const CSI_PATTERN = new RegExp(`^${ESCAPE_SEQUENCE}\\[([0-9;?]*)([ABCDHJKf])`);
const SGR_PATTERN = new RegExp(`^${ESCAPE_SEQUENCE}\\[[0-9;]*m`);

export class Terminal {
    private lines: TerminalLine[] = [];
    private size: TerminalSize;
    private nextLineId = 1;
    private onChange?: TerminalChangeListener;
    private cursorColumn = 0;
    private cursorRow = 0;

    public constructor(options?: {
        initialLines?: string[];
        onChange?: TerminalChangeListener;
        size?: Partial<TerminalSize>;
    }) {
        this.size = {
            columns: options?.size?.columns ?? DEFAULT_SIZE.columns,
            rows: options?.size?.rows ?? DEFAULT_SIZE.rows,
        };
        this.onChange = options?.onChange;
        this.lines =
            options?.initialLines?.map(
                (line): TerminalLine => this.createLine(line),
            ) ?? [];
        this.cursorRow = Math.max(0, this.lines.length - 1);
        this.cursorColumn = this.lines[this.cursorRow]?.text.length ?? 0;
    }

    public attach(onChange: TerminalChangeListener): void {
        this.onChange = onChange;
        this.emitChange();
    }

    public setSize(size: Partial<TerminalSize>): void {
        this.size = {
            columns: size.columns ?? this.size.columns,
            rows: size.rows ?? this.size.rows,
        };
    }

    public getColumns(): number {
        return this.size.columns;
    }

    public getRows(): number {
        return this.size.rows;
    }

    public getSize(): TerminalSize {
        return { ...this.size };
    }

    public snapshot(): TerminalLine[] {
        return this.lines.map((line): { id: string; text: string } => ({
            ...line,
        }));
    }

    public clear(): void {
        this.lines = [];
        this.cursorColumn = 0;
        this.cursorRow = 0;
        this.emitChange();
    }

    public putc(char: string): void {
        if (char.length === 0) return;
        this.write(char.charAt(0));
    }

    public write(text: string): void {
        for (let i = 0; i < text.length; i++) {
            const char = text.charAt(i);
            if (char === '\u001B') {
                const consumed = this.consumeAnsiSequence(text.slice(i));
                if (consumed > 0) {
                    i += consumed - 1;
                    continue;
                }
            }
            this.writeChar(char);
        }
        this.emitChange();
    }

    public puts(text = ''): void {
        this.write(`${text}\n`);
    }

    public writeLines(lines: string[]): void {
        for (const line of lines) {
            this.puts(line);
        }
    }

    private writeChar(char: string): void {
        switch (char) {
            case '\n': {
                this.cursorRow++;
                this.cursorColumn = 0;
                this.ensureLine(this.cursorRow);
                return;
            }
            case '\r': {
                this.cursorColumn = 0;
                return;
            }
            case '\b': {
                if (this.cursorColumn > 0) {
                    this.cursorColumn--;
                    const line = this.currentLine();
                    line.text =
                        line.text.slice(0, this.cursorColumn) +
                        line.text.slice(this.cursorColumn + 1);
                }
                return;
            }
            default: {
                this.writePrintableChar(char);
            }
        }
    }

    private currentLine(): TerminalLine {
        this.ensureLine(this.cursorRow);
        const line = this.lines[this.cursorRow];
        if (!line) {
            throw new Error('Terminal line missing after ensureLine.');
        }
        return line;
    }

    private ensureLine(row: number): void {
        while (this.lines.length <= row) {
            this.lines.push(this.createLine(''));
        }
    }

    private writePrintableChar(char: string): void {
        const line = this.currentLine();
        if (this.cursorColumn > line.text.length) {
            line.text = line.text.padEnd(this.cursorColumn, ' ');
        }
        line.text =
            line.text.slice(0, this.cursorColumn) +
            char +
            line.text.slice(this.cursorColumn + 1);
        this.cursorColumn++;
    }

    private createLine(text: string): TerminalLine {
        return {
            id: String(this.nextLineId++),
            text,
        };
    }

    private emitChange(): void {
        this.onChange?.(this.snapshot());
    }

    private consumeAnsiSequence(sequence: string): number {
        const csi = CSI_PATTERN.exec(sequence);
        if (csi) {
            this.applyCsi(csi[1] ?? '', csi[2] ?? '');
            return csi[0].length;
        }

        const sgr = SGR_PATTERN.exec(sequence);
        if (sgr) {
            this.currentLine().text += sgr[0];
            return sgr[0].length;
        }

        return 0;
    }

    private applyCsi(parameters: string, command: string): void {
        const values = parameters
            .replace(/^\?/, '')
            .split(';')
            .filter(Boolean)
            .map(Number);

        switch (command) {
            case 'A': {
                this.cursorRow = Math.max(0, this.cursorRow - (values[0] || 1));
                break;
            }
            case 'B': {
                this.cursorRow += values[0] || 1;
                this.ensureLine(this.cursorRow);
                break;
            }
            case 'C': {
                this.cursorColumn += values[0] || 1;
                break;
            }
            case 'D': {
                this.cursorColumn = Math.max(
                    0,
                    this.cursorColumn - (values[0] || 1),
                );
                break;
            }
            case 'H':
            case 'f': {
                this.cursorRow = Math.max(0, (values[0] || 1) - 1);
                this.cursorColumn = Math.max(0, (values[1] || 1) - 1);
                this.ensureLine(this.cursorRow);
                break;
            }
            case 'J': {
                if ((values[0] || 0) === 2) {
                    this.lines = [];
                    this.cursorRow = 0;
                    this.cursorColumn = 0;
                }
                break;
            }
            case 'K': {
                const line = this.currentLine();
                if ((values[0] || 0) === 2) {
                    line.text = '';
                    this.cursorColumn = 0;
                } else {
                    line.text = line.text.slice(0, this.cursorColumn);
                }
                break;
            }
        }
    }
}
