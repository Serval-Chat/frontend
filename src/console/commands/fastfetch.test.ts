import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usersApi } from '@/api/users/users.api';
import type { User } from '@/api/users/users.types';
import { Terminal } from '@/console/Terminal';
import { parseAnsi } from '@/console/utils/ansiParser';

import packageJson from '../../../package.json';
import { fastfetchCommand } from './fastfetch';

vi.mock('@/api/users/users.api', () => ({
    usersApi: {
        getMe: vi.fn(),
    },
}));

const MODULE_LABELS = [
    'OS',
    'Host',
    'Kernel',
    'Uptime',
    'Packages',
    'Shell',
    'Resolution',
    'Terminal',
    'CPU',
    'GPU',
    'Memory',
    'Disk',
];

const baseContext = { dispatch: (() => {}) as any };

describe('fastfetch command', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(usersApi.getMe).mockRejectedValue(new Error('not mocked'));
        localStorage.clear();
    });

    afterEach((): void => {
        vi.restoreAllMocks();
    });

    it('matches only the fastfetch command', (): void => {
        expect(fastfetchCommand.match(1, ['fastfetch'])).toBe(true);
        expect(fastfetchCommand.match(1, ['FASTFETCH'])).toBe(true);
        expect(fastfetchCommand.match(1, ['fetch'])).toBe(false);
        expect(fastfetchCommand.match(1, ['fastfetc'])).toBe(false);
    });

    it('shows every module by default, with a guest@host header', async (): Promise<void> => {
        const result = await fastfetchCommand.execute(
            1,
            ['fastfetch'],
            baseContext,
        );
        const output = result.output ?? [];

        expect(output.some((line): boolean => /guest@\S+/.test(line))).toBe(
            true,
        );
        for (const label of MODULE_LABELS) {
            expect(
                output.some((line): boolean => line.includes(`${label}:`)),
            ).toBe(true);
        }
    });

    it('produces output lines with no embedded newlines', async (): Promise<void> => {
        const result = await fastfetchCommand.execute(
            1,
            ['fastfetch'],
            baseContext,
        );
        for (const line of result.output ?? []) {
            expect(line).not.toContain('\n');
        }
    });

    it('round-trips every line through the terminal and ANSI parser without corruption', async (): Promise<void> => {
        const result = await fastfetchCommand.execute(
            1,
            ['fastfetch'],
            baseContext,
        );
        const lines = result.output ?? [];

        const terminal = new Terminal({ size: { columns: 200, rows: 200 } });
        terminal.writeLines(lines);

        const stored = terminal.snapshot().map((l): string => l.text);
        expect(stored.filter(Boolean)).toEqual(lines.filter(Boolean));

        for (const line of stored) {
            expect(parseAnsi(line)).toBeDefined();
        }
    });

    it('/filter shows only the requested modules, in the requested order', async (): Promise<void> => {
        const result = await fastfetchCommand.execute(
            2,
            ['fastfetch', '/filter:gpu,cpu'],
            baseContext,
        );
        const output = result.output ?? [];

        const gpuIndex = output.findIndex((line): boolean =>
            line.includes('GPU:'),
        );
        const cpuIndex = output.findIndex((line): boolean =>
            line.includes('CPU:'),
        );

        expect(gpuIndex).toBeGreaterThanOrEqual(0);
        expect(cpuIndex).toBeGreaterThan(gpuIndex);
        expect(output.some((line): boolean => line.includes('OS:'))).toBe(
            false,
        );
        expect(output.some((line): boolean => line.includes('Host:'))).toBe(
            false,
        );
    });

    it('rejects an invalid filter module', async (): Promise<void> => {
        const result = await fastfetchCommand.execute(
            2,
            ['fastfetch', '/filter:bogus'],
            baseContext,
        );
        expect(result.output?.[0]).toBe("fastfetch: invalid module 'bogus'");
    });

    it('rejects an unrecognized flag', async (): Promise<void> => {
        const result = await fastfetchCommand.execute(
            2,
            ['fastfetch', '/bogus'],
            baseContext,
        );
        expect(result.output?.[0]).toBe("fastfetch: invalid operand '/bogus'");
    });

    it('/list lists every module key', async (): Promise<void> => {
        const result = await fastfetchCommand.execute(
            2,
            ['fastfetch', '/list'],
            baseContext,
        );
        const output = result.output ?? [];

        for (const key of [
            'os',
            'host',
            'kernel',
            'uptime',
            'packages',
            'shell',
            'resolution',
            'terminal',
            'cpu',
            'gpu',
            'memory',
            'disk',
        ]) {
            expect(output.some((line): boolean => line.includes(key))).toBe(
                true,
            );
        }
    });

    it('/? shows usage instead of a fetched summary', async (): Promise<void> => {
        const result = await fastfetchCommand.execute(
            2,
            ['fastfetch', '/?'],
            baseContext,
        );
        expect(result.output?.[0]).toContain('Displays a summary');
        expect(
            result.output?.some((line): boolean => line.includes('guest@')),
        ).toBe(false);
        expect(usersApi.getMe).not.toHaveBeenCalled();
    });

    it('reflects the real terminal size in the Terminal module', async (): Promise<void> => {
        const terminal = new Terminal({ size: { columns: 42, rows: 17 } });
        const result = await fastfetchCommand.execute(
            2,
            ['fastfetch', '/filter:terminal'],
            { dispatch: (() => {}) as any, terminal },
        );
        expect(
            result.output?.some((line): boolean => line.includes('42x17')),
        ).toBe(true);
    });

    it('renders the ascii logo beside the info lines', async (): Promise<void> => {
        const result = await fastfetchCommand.execute(
            1,
            ['fastfetch'],
            baseContext,
        );
        const output = result.output ?? [];

        expect(
            output.some((line): boolean => line.includes('(_/ (_/')),
        ).toBe(true);
        expect(output.some((line): boolean => line.includes('X     `'))).toBe(
            true,
        );
    });

    it('keeps showing the full logo even when filtered to a single module', async (): Promise<void> => {
        const result = await fastfetchCommand.execute(
            2,
            ['fastfetch', '/filter:os'],
            baseContext,
        );
        const output = result.output ?? [];

        expect(
            output.some((line): boolean => line.includes('(_/ (_/')),
        ).toBe(true);
    });

    it('Packages module reports the real dependency count from package.json', async (): Promise<void> => {
        const result = await fastfetchCommand.execute(
            2,
            ['fastfetch', '/filter:packages'],
            baseContext,
        );
        const expectedCount =
            Object.keys(packageJson.dependencies ?? {}).length +
            Object.keys(packageJson.devDependencies ?? {}).length;

        expect(
            result.output?.some((line): boolean =>
                line.includes(`${expectedCount} (npm)`),
            ),
        ).toBe(true);
    });

    it('keeps OS, Kernel, and Shell from the same OS family (no DOS shell under NT, or vice versa)', async (): Promise<void> => {
        for (let i = 0; i < 40; i++) {
            const result = await fastfetchCommand.execute(
                2,
                ['fastfetch', '/filter:os,kernel,shell'],
                baseContext,
            );
            const output = result.output ?? [];
            const osLine =
                output.find((line): boolean => line.includes('OS:')) ?? '';
            const kernelLine =
                output.find((line): boolean => line.includes('Kernel:')) ??
                '';
            const shellLine =
                output.find((line): boolean => line.includes('Shell:')) ??
                '';

            if (osLine.includes('DOS')) {
                expect(shellLine).toContain('command.com');
                expect(kernelLine).toContain('DOS');
                expect(kernelLine).not.toContain('NT');
            } else {
                expect(shellLine).toContain('cmd.exe');
                expect(shellLine).not.toContain('command.com');
                expect(kernelLine).toContain('NT');
            }
        }
    });

    it('Uptime module reports a real age computed from the signed-in user', async (): Promise<void> => {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        vi.mocked(usersApi.getMe).mockResolvedValue({
            createdAt: twoYearsAgo,
        } as User);

        const result = await fastfetchCommand.execute(
            2,
            ['fastfetch', '/filter:uptime'],
            baseContext,
        );

        expect(usersApi.getMe).toHaveBeenCalledTimes(1);
        expect(
            result.output?.some((line): boolean => line.includes('2 years')),
        ).toBe(true);
    });

    it('Uptime falls back gracefully when there is no signed-in user', async (): Promise<void> => {
        vi.mocked(usersApi.getMe).mockRejectedValue(new Error('401'));

        const result = await fastfetchCommand.execute(
            2,
            ['fastfetch', '/filter:uptime'],
            baseContext,
        );

        expect(
            result.output?.some((line): boolean =>
                line.includes('unknown (not signed in)'),
            ),
        ).toBe(true);
    });

    it('keeps the Host module and the guest@host header stable across calls', async (): Promise<void> => {
        const first = await fastfetchCommand.execute(
            2,
            ['fastfetch', '/filter:host'],
            baseContext,
        );
        const second = await fastfetchCommand.execute(
            2,
            ['fastfetch', '/filter:host'],
            baseContext,
        );

        const hostLine = (output: string[] | undefined): string =>
            output?.find((line): boolean => line.includes('Host:')) ?? '';
        const headerLine = (output: string[] | undefined): string =>
            output?.find((line): boolean => /guest@\S+/.test(line)) ?? '';

        expect(hostLine(first.output)).toBe(hostLine(second.output));
        expect(headerLine(first.output)).toBe(headerLine(second.output));
    });

    it('does not fetch the current user when Uptime is filtered out', async (): Promise<void> => {
        await fastfetchCommand.execute(
            2,
            ['fastfetch', '/filter:cpu,gpu'],
            baseContext,
        );
        expect(usersApi.getMe).not.toHaveBeenCalled();
    });

    it('keeps the whole fetched summary stable across calls, like a real machine identity', async (): Promise<void> => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        const first = (
            await fastfetchCommand.execute(1, ['fastfetch'], baseContext)
        ).output;

        vi.spyOn(Math, 'random').mockReturnValue(0.99);
        const second = (
            await fastfetchCommand.execute(1, ['fastfetch'], baseContext)
        ).output;

        expect(first).toEqual(second);
    });

    it('only generates a new identity once localStorage is cleared, like a fresh machine', async (): Promise<void> => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        const first = (
            await fastfetchCommand.execute(1, ['fastfetch'], baseContext)
        ).output;

        localStorage.clear();

        vi.spyOn(Math, 'random').mockReturnValue(0.99);
        const second = (
            await fastfetchCommand.execute(1, ['fastfetch'], baseContext)
        ).output;

        expect(first).not.toEqual(second);
    });
});
