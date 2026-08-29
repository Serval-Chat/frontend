import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CommandContext } from '@/console/ConCommandRegistry';
import { DosFileSystem } from '@/console/DosFileSystem';
import { getHostname } from '@/console/systemIdentity';

import { formatCommand } from './format';

describe('format command', (): void => {
    beforeEach((): void => {
        localStorage.clear();
    });

    it('matches only the format command', (): void => {
        expect(formatCommand.match(1, ['format'])).toBe(true);
        expect(formatCommand.match(1, ['FORMAT'])).toBe(true);
        expect(formatCommand.match(1, ['formatted'])).toBe(false);
    });

    it('requires a drive specification', (): void => {
        const context: CommandContext = { dispatch: vi.fn() as any };
        const result = formatCommand.execute(1, ['format'], context);
        expect(result.output?.[0]).toContain('Required parameter missing');
    });

    it('rejects any drive other than C:', (): void => {
        const context: CommandContext = { dispatch: vi.fn() as any };
        const result = formatCommand.execute(2, ['format', 'D:'], context);
        expect(result.output).toEqual(['Invalid drive specification']);
    });

    it('shows a warning and does not wipe anything without /Y', (): void => {
        const filesystem = new DosFileSystem();
        filesystem.writeFile('KEEPME.TXT', 'still here');
        const context: CommandContext = {
            dispatch: vi.fn() as any,
            filesystem,
        };

        const result = formatCommand.execute(2, ['format', 'C:'], context);

        expect(result.output?.join('\n')).toContain('WARNING');
        expect(filesystem.readFile('KEEPME.TXT')).toBe('still here');
    });

    it('wipes the filesystem and system identity when confirmed with /Y', (): void => {
        const filesystem = new DosFileSystem();
        filesystem.writeFile('KEEPME.TXT', 'still here');
        getHostname();
        expect(
            localStorage.getItem('serchat.console.systemIdentity.v2'),
        ).toBeTruthy();

        const context: CommandContext = {
            dispatch: vi.fn() as any,
            filesystem,
        };

        const result = formatCommand.execute(
            3,
            ['format', 'C:', '/Y'],
            context,
        );

        expect(result.output?.join('\n')).toContain('Format complete');
        expect(() => filesystem.readFile('KEEPME.TXT')).toThrow();
        expect(filesystem.readFile('README.TXT')).toContain(
            'Serchat Console',
        );

        expect(
            localStorage.getItem('serchat.console.systemIdentity.v2'),
        ).toBeNull();
    });

    it('reports an error when the console has no filesystem', (): void => {
        const context: CommandContext = { dispatch: vi.fn() as any };
        const result = formatCommand.execute(
            3,
            ['format', 'C:', '/Y'],
            context,
        );
        expect(result.output).toEqual([
            'FORMAT: console does not support the filesystem.',
        ]);
    });
});
