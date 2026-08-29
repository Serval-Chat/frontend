import { describe, expect, it, vi } from 'vitest';

import type { CommandContext } from '@/console/ConCommandRegistry';
import { DosFileSystem } from '@/console/DosFileSystem';
import { BasicProgram } from '@/console/programs/BasicProgram';

import { basicCommand } from './basic';

describe('basic command', (): void => {
    it('starts a BasicProgram through the console program system, with no file', (): void => {
        const startProgram = vi.fn();
        const context: CommandContext = {
            dispatch: vi.fn() as unknown as CommandContext['dispatch'],
            terminal: { clear: vi.fn(), write: vi.fn(), puts: vi.fn() } as any,
            filesystem: new DosFileSystem(),
            startProgram,
            endProgram: vi.fn(),
        };

        const result = basicCommand.execute(1, ['basic'], context);

        expect(startProgram).toHaveBeenCalledTimes(1);
        expect(startProgram.mock.calls[0][0]).toBeInstanceOf(BasicProgram);
        expect(result).toEqual({});
    });

    it('passes a filename argument through as the initial file to load', (): void => {
        const startProgram = vi.fn();
        const context: CommandContext = {
            dispatch: vi.fn() as unknown as CommandContext['dispatch'],
            terminal: { clear: vi.fn(), write: vi.fn(), puts: vi.fn() } as any,
            filesystem: new DosFileSystem(),
            startProgram,
            endProgram: vi.fn(),
        };

        void basicCommand.execute(2, ['basic', 'GAME.BAS'], context);

        const program = startProgram.mock.calls[0][0] as BasicProgram;
        expect(program).toBeInstanceOf(BasicProgram);
    });

    it('reports an error when the console does not support programs', (): void => {
        const context: CommandContext = {
            dispatch: vi.fn() as unknown as CommandContext['dispatch'],
        };

        const result = basicCommand.execute(1, ['basic'], context);

        expect(result).toEqual({
            output: ['BASIC: console does not support full-screen mode.'],
        });
    });
});
