import { describe, expect, it, vi } from 'vitest';

import type { CommandContext } from '@/console/ConCommandRegistry';
import { SnakeProgram } from '@/console/programs/SnakeProgram';

import { snakeCommand } from './snake';

describe('snake command', (): void => {
    it('starts a SnakeProgram through the console program system', (): void => {
        const startProgram = vi.fn();
        const context: CommandContext = {
            dispatch: vi.fn() as unknown as CommandContext['dispatch'],
            terminal: { clear: vi.fn(), write: vi.fn(), puts: vi.fn() } as any,
            startProgram,
            endProgram: vi.fn(),
        };

        const result = snakeCommand.execute(1, ['snake'], context);

        expect(startProgram).toHaveBeenCalledTimes(1);
        expect(startProgram.mock.calls[0][0]).toBeInstanceOf(SnakeProgram);
        expect(result).toEqual({});
    });

    it('reports an error when the console does not support programs', (): void => {
        const context: CommandContext = {
            dispatch: vi.fn() as unknown as CommandContext['dispatch'],
        };

        const result = snakeCommand.execute(1, ['snake'], context);

        expect(result).toEqual({
            output: ['Error: Console does not support interactive commands.'],
        });
    });
});
