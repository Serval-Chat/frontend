import type {
    ConsoleKeyEvent,
    ConsoleProgram,
} from '@/console/ConCommandRegistry';
import type { DosFileSystem } from '@/console/DosFileSystem';
import type { Terminal } from '@/console/Terminal';

const RESET = '\u001B[0m';
const CURSOR = '\u001B[30;107m';
const TITLE = '\u001B[30;47m';
const STATUS = '\u001B[37;44m';

const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));

const visualLength = (value: string): number => value.length;

export class DosEditorProgram implements ConsoleProgram {
    private readonly filesystem: DosFileSystem;
    private readonly onExit: () => void;
    private readonly path: string;
    private readonly terminal: Terminal;
    private cursorColumn = 0;
    private cursorRow = 0;
    private dirty = false;
    private lines: string[];
    private preferredColumn = 0;
    private promptExit = false;
    private scrollColumn = 0;
    private scrollRow = 0;
    private statusMessage = 'F1=Help  Ctrl+S=Save  F10=Exit';

    public constructor(options: {
        filesystem: DosFileSystem;
        onExit: () => void;
        path: string;
        terminal: Terminal;
    }) {
        this.filesystem = options.filesystem;
        this.onExit = options.onExit;
        this.path = options.path;
        this.terminal = options.terminal;

        try {
            this.lines = this.filesystem.readFile(this.path).split('\n');
            this.statusMessage = `${this.path.toUpperCase()} loaded`;
        } catch {
            this.lines = [''];
            this.statusMessage = `New file: ${this.path.toUpperCase()}`;
        }
    }

    public start(): void {
        this.render();
    }

    public handleKeyDown(event: ConsoleKeyEvent): void {
        event.preventDefault();

        if (this.promptExit) {
            this.handleExitPrompt(event.key);
            return;
        }

        if (event.ctrlKey && event.key.toLowerCase() === 's') {
            this.save();
            return;
        }
        if (event.ctrlKey && event.key.toLowerCase() === 'q') {
            this.exit();
            return;
        }
        if (event.ctrlKey && event.key.toLowerCase() === 'w') {
            this.exit();
            return;
        }

        switch (event.key) {
            case 'ArrowUp': {
                this.moveVertical(-1);
                break;
            }
            case 'ArrowDown': {
                this.moveVertical(1);
                break;
            }
            case 'ArrowLeft': {
                this.moveLeft();
                break;
            }
            case 'ArrowRight': {
                this.moveRight();
                break;
            }
            case 'Home': {
                this.cursorColumn = 0;
                this.preferredColumn = this.cursorColumn;
                break;
            }
            case 'End': {
                this.cursorColumn = this.currentLine().length;
                this.preferredColumn = this.cursorColumn;
                break;
            }
            case 'PageUp': {
                this.moveVertical(-this.visibleRows());
                break;
            }
            case 'PageDown': {
                this.moveVertical(this.visibleRows());
                break;
            }
            case 'Enter': {
                this.insertNewLine();
                break;
            }
            case 'Backspace': {
                this.backspace();
                break;
            }
            case 'Delete': {
                this.deleteForward();
                break;
            }
            case 'Escape': {
                this.exit();
                break;
            }
            case 'F10': {
                this.exit();
                break;
            }
            case 'F1': {
                this.statusMessage =
                    'Arrows move  Enter splits  Backspace/Delete remove  Ctrl+S saves  F10/Ctrl+W exits';
                break;
            }
            default: {
                if (event.key.length === 1 && !event.ctrlKey && !event.altKey) {
                    this.insertText(event.key);
                }
            }
        }

        this.ensureCursorVisible();
        this.render();
    }

    private backspace(): void {
        if (this.cursorColumn > 0) {
            const line = this.currentLine();
            this.lines[this.cursorRow] =
                line.slice(0, this.cursorColumn - 1) +
                line.slice(this.cursorColumn);
            this.cursorColumn--;
        } else if (this.cursorRow > 0) {
            const previousLine = this.lines[this.cursorRow - 1] ?? '';
            const previousLength = previousLine.length;
            this.lines[this.cursorRow - 1] = previousLine + this.currentLine();
            this.lines.splice(this.cursorRow, 1);
            this.cursorRow--;
            this.cursorColumn = previousLength;
        }
        this.markDirty();
    }

    private currentLine(): string {
        return this.lines[this.cursorRow] ?? '';
    }

    private deleteForward(): void {
        const line = this.currentLine();
        if (this.cursorColumn < line.length) {
            this.lines[this.cursorRow] =
                line.slice(0, this.cursorColumn) +
                line.slice(this.cursorColumn + 1);
            this.markDirty();
        } else if (this.cursorRow < this.lines.length - 1) {
            this.lines[this.cursorRow] =
                (this.lines[this.cursorRow] ?? '') +
                (this.lines[this.cursorRow + 1] ?? '');
            this.lines.splice(this.cursorRow + 1, 1);
            this.markDirty();
        }
    }

    private exit(): void {
        if (this.dirty) {
            this.promptExit = true;
            this.statusMessage = 'File modified. Save before exit? Y/N/Esc';
            this.render();
            return;
        }
        this.finish();
    }

    private finish(): void {
        this.terminal.write('\u001B[2J\u001B[H');
        this.onExit();
    }

    private handleExitPrompt(key: string): void {
        if (key === 'Escape') {
            this.promptExit = false;
            this.statusMessage = 'Exit canceled';
            this.render();
            return;
        }
        if (key.toLowerCase() === 'y') {
            this.save();
            this.finish();
            return;
        }
        if (key.toLowerCase() === 'n') {
            this.finish();
        }
    }

    private insertNewLine(): void {
        const line = this.currentLine();
        const left = line.slice(0, this.cursorColumn);
        const right = line.slice(this.cursorColumn);
        this.lines[this.cursorRow] = left;
        this.lines.splice(this.cursorRow + 1, 0, right);
        this.cursorRow++;
        this.cursorColumn = 0;
        this.markDirty();
    }

    private insertText(text: string): void {
        const line = this.currentLine();
        this.lines[this.cursorRow] =
            line.slice(0, this.cursorColumn) +
            text +
            line.slice(this.cursorColumn);
        this.cursorColumn += text.length;
        this.markDirty();
    }

    private markDirty(): void {
        this.dirty = true;
        this.preferredColumn = this.cursorColumn;
        this.statusMessage = 'Modified';
    }

    private moveLeft(): void {
        if (this.cursorColumn > 0) {
            this.cursorColumn--;
        } else if (this.cursorRow > 0) {
            this.cursorRow--;
            this.cursorColumn = this.currentLine().length;
        }
        this.preferredColumn = this.cursorColumn;
    }

    private moveRight(): void {
        if (this.cursorColumn < this.currentLine().length) {
            this.cursorColumn++;
        } else if (this.cursorRow < this.lines.length - 1) {
            this.cursorRow++;
            this.cursorColumn = 0;
        }
        this.preferredColumn = this.cursorColumn;
    }

    private moveVertical(delta: number): void {
        this.cursorRow = clamp(
            this.cursorRow + delta,
            0,
            Math.max(0, this.lines.length - 1),
        );
        this.cursorColumn = clamp(
            this.preferredColumn,
            0,
            this.currentLine().length,
        );
    }

    private render(): void {
        const { columns, rows } = this.terminal.getSize();
        const width = Math.max(columns, 20);
        const height = Math.max(rows, 6);
        const bodyRows = Math.max(1, height - 3);

        this.ensureCursorVisible();
        this.terminal.write('\u001B[2J\u001B[H');
        this.writeAt(
            1,
            1,
            `${TITLE}${this.pad(` EDIT  ${this.path.toUpperCase()}`, width)}${RESET}`,
        );

        for (let index = 0; index < bodyRows; index++) {
            const fileRow = this.scrollRow + index;
            const raw = this.lines[fileRow] ?? '';
            let visible = this.pad(
                raw.slice(this.scrollColumn, this.scrollColumn + width),
                width,
            );
            if (fileRow === this.cursorRow) {
                const cursorScreenColumn =
                    this.cursorColumn - this.scrollColumn;
                if (cursorScreenColumn >= 0 && cursorScreenColumn < width) {
                    const cursorChar = visible[cursorScreenColumn];
                    visible =
                        visible.slice(0, cursorScreenColumn) +
                        `${CURSOR}${cursorChar}${RESET}` +
                        visible.slice(cursorScreenColumn + 1);
                }
            }
            this.writeAt(index + 2, 1, visible);
        }

        const position = `Ln ${this.cursorRow + 1}, Col ${this.cursorColumn + 1}`;
        this.writeAt(
            height - 1,
            1,
            `${STATUS}${this.pad(this.statusMessage, width - position.length)}${position}${RESET}`,
        );
        this.writeAt(
            height,
            1,
            `${STATUS}${this.pad('Ctrl+S Save   F10/Ctrl+W Exit   Esc Exit   F1 Help', width)}${RESET}`,
        );
    }

    private save(): void {
        try {
            this.filesystem.writeFile(this.path, this.lines.join('\n'));
            this.dirty = false;
            this.promptExit = false;
            this.statusMessage = `${this.path.toUpperCase()} saved`;
        } catch (error) {
            this.statusMessage =
                error instanceof Error ? error.message : String(error);
        }
        this.render();
    }

    private ensureCursorVisible(): void {
        const bodyRows = this.visibleRows();
        if (this.cursorRow < this.scrollRow) this.scrollRow = this.cursorRow;
        if (this.cursorRow >= this.scrollRow + bodyRows) {
            this.scrollRow = this.cursorRow - bodyRows + 1;
        }
        if (this.cursorColumn < this.scrollColumn) {
            this.scrollColumn = this.cursorColumn;
        }
        if (
            this.cursorColumn >=
            this.scrollColumn + this.terminal.getColumns()
        ) {
            this.scrollColumn =
                this.cursorColumn - this.terminal.getColumns() + 1;
        }
    }

    private visibleRows(): number {
        return Math.max(1, this.terminal.getRows() - 3);
    }

    private pad(value: string, width: number): string {
        if (visualLength(value) >= width) return value.slice(0, width);
        return value.padEnd(width, ' ');
    }

    private writeAt(row: number, column: number, text: string): void {
        this.terminal.write(`\u001B[${row};${column}H${text}`);
    }
}
