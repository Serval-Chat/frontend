import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ConsoleKeyEvent } from '@/console/ConCommandRegistry';
import { Terminal } from '@/console/Terminal';

import { SnakeProgram } from './SnakeProgram';

const key = (
    keyName: string,
): ConsoleKeyEvent & { preventDefault: ReturnType<typeof vi.fn> } => ({
    altKey: false,
    ctrlKey: false,
    key: keyName,
    preventDefault: vi.fn(),
});

const boardText = (terminal: Terminal): string =>
    terminal
        .snapshot()
        .map((l) => l.text)
        .join('\n');

describe('SnakeProgram', (): void => {
    beforeEach((): void => {
        vi.useFakeTimers();
    });

    afterEach((): void => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('renders the board as soon as it starts, before any tick', (): void => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const program = new SnakeProgram({ terminal, onExit: vi.fn() });

        program.start();

        const text = boardText(terminal);
        expect(text).toContain('Snek Game');
        expect(text).toContain('Score: 0');
    });

    it('consumes arrow-key events so they never reach the console input', (): void => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const program = new SnakeProgram({ terminal, onExit: vi.fn() });
        program.start();

        const event = key('ArrowUp');
        program.handleKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('advances the snake on each game tick', (): void => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const program = new SnakeProgram({ terminal, onExit: vi.fn() });
        program.start();

        const before = boardText(terminal);
        vi.advanceTimersByTime(150);
        const after = boardText(terminal);

        expect(after).not.toBe(before);
    });

    it('ignores a 180-degree reversal so the snake cannot run into itself', (): void => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const program = new SnakeProgram({ terminal, onExit: vi.fn() });
        program.start();

        program.handleKeyDown(key('ArrowLeft'));
        vi.advanceTimersByTime(150 * 6);

        expect(boardText(terminal)).not.toContain('GAME OVER!');
    });

    it('stops the loop and hands control back via onExit when the snake hits a wall', (): void => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const onExit = vi.fn();
        const program = new SnakeProgram({ terminal, onExit });
        program.start();

        program.handleKeyDown(key('ArrowUp'));
        // snake starts at y=5; six ticks upward runs it off the top edge
        vi.advanceTimersByTime(150 * 6);

        expect(boardText(terminal)).toContain('GAME OVER!');

        const afterGameOver = boardText(terminal);
        vi.advanceTimersByTime(150 * 5);
        expect(boardText(terminal)).toBe(afterGameOver);
        expect(onExit).not.toHaveBeenCalled();
    });

    it('still exits on Q after game over', (): void => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const onExit = vi.fn();
        const program = new SnakeProgram({ terminal, onExit });
        program.start();

        program.handleKeyDown(key('ArrowUp'));
        vi.advanceTimersByTime(150 * 6);
        expect(boardText(terminal)).toContain('GAME OVER!');

        program.handleKeyDown(key('q'));

        expect(onExit).toHaveBeenCalledTimes(1);
    });

    it('quits immediately on Q, stopping the loop and calling onExit', (): void => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const onExit = vi.fn();
        const program = new SnakeProgram({ terminal, onExit });
        program.start();

        program.handleKeyDown(key('q'));

        expect(onExit).toHaveBeenCalledTimes(1);

        const afterQuit = boardText(terminal);
        vi.advanceTimersByTime(150 * 5);
        expect(boardText(terminal)).toBe(afterQuit);
    });

    it('does not restart the game or double the tick rate when start() is called again (terminal resize)', (): void => {
        const terminal = new Terminal({ size: { columns: 80, rows: 25 } });
        const program = new SnakeProgram({ terminal, onExit: vi.fn() });
        program.start();

        vi.advanceTimersByTime(150);
        const afterOneTick = boardText(terminal);

        program.start();
        expect(boardText(terminal)).toBe(afterOneTick);

        vi.advanceTimersByTime(150);
        const afterTwoTicks = boardText(terminal);
        expect(afterTwoTicks).not.toBe(afterOneTick);

        vi.advanceTimersByTime(1);
        expect(boardText(terminal)).toBe(afterTwoTicks);
    });
});
