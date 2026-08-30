import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CommandContext } from '@/console/ConCommandRegistry';
import { DosFileSystem } from '@/console/DosFileSystem';
import * as filePicker from '@/console/utils/filePicker';

import { uploadCommand } from './upload';

vi.mock('@/console/utils/filePicker', () => ({
    pickTextFile: vi.fn(),
}));

const pickTextFile = vi.mocked(filePicker.pickTextFile);

describe('upload command', (): void => {
    beforeEach((): void => {
        localStorage.clear();
        pickTextFile.mockReset();
    });

    it('matches only the upload command', (): void => {
        expect(uploadCommand.match(1, ['upload'])).toBe(true);
        expect(uploadCommand.match(1, ['UPLOAD'])).toBe(true);
        expect(uploadCommand.match(1, ['uploaded'])).toBe(false);
    });

    it('reports an error when the console has no filesystem', async (): Promise<void> => {
        const context: CommandContext = { dispatch: vi.fn() as any };
        const result = await uploadCommand.execute(1, ['upload'], context);
        expect(result.output).toEqual(['File system is not available.']);
        expect(pickTextFile).not.toHaveBeenCalled();
    });

    it('reports cancellation without touching the filesystem', async (): Promise<void> => {
        pickTextFile.mockResolvedValue(null);
        const filesystem = new DosFileSystem();
        const context: CommandContext = {
            dispatch: vi.fn() as any,
            filesystem,
        };

        const result = await uploadCommand.execute(1, ['upload'], context);

        expect(result.output).toEqual(['Upload cancelled.']);
        expect(() => filesystem.readFile('NOTES.TXT')).toThrow();
    });

    it('writes the picked file under its own name by default', async (): Promise<void> => {
        pickTextFile.mockResolvedValue({ name: 'notes.txt', content: 'hello' });
        const filesystem = new DosFileSystem();
        const context: CommandContext = {
            dispatch: vi.fn() as any,
            filesystem,
        };

        const result = await uploadCommand.execute(1, ['upload'], context);

        expect(result.output).toEqual(['        1 file(s) uploaded.']);
        expect(filesystem.readFile('NOTES.TXT')).toBe('hello');
    });

    it('writes the picked file under an explicit destination name', async (): Promise<void> => {
        pickTextFile.mockResolvedValue({ name: 'notes.txt', content: 'hello' });
        const filesystem = new DosFileSystem();
        const context: CommandContext = {
            dispatch: vi.fn() as any,
            filesystem,
        };

        await uploadCommand.execute(2, ['upload', 'README.TXT'], context);

        expect(filesystem.readFile('README.TXT')).toBe('hello');
        expect(() => filesystem.readFile('NOTES.TXT')).toThrow();
    });

    it('shows the copy dialog before writing, and skips the write if cancelled there', async (): Promise<void> => {
        pickTextFile.mockResolvedValue({ name: 'notes.txt', content: 'hello' });
        const filesystem = new DosFileSystem();
        const copyFile = vi.fn().mockResolvedValue({ cancelled: true });
        const context: CommandContext = {
            dispatch: vi.fn() as any,
            filesystem,
            copyFile,
        };

        const result = await uploadCommand.execute(1, ['upload'], context);

        expect(copyFile).toHaveBeenCalledWith({
            fileName: 'notes.txt',
            from: 'Your Computer',
            to: `${filesystem.getCwd()}NOTES.TXT`,
            size: 5,
        });
        expect(result.output).toEqual(['Upload cancelled.']);
        expect(() => filesystem.readFile('NOTES.TXT')).toThrow();
    });

    it('writes the file once the copy dialog resolves without cancellation', async (): Promise<void> => {
        pickTextFile.mockResolvedValue({ name: 'notes.txt', content: 'hello' });
        const filesystem = new DosFileSystem();
        const copyFile = vi.fn().mockResolvedValue({ cancelled: false });
        const context: CommandContext = {
            dispatch: vi.fn() as any,
            filesystem,
            copyFile,
        };

        const result = await uploadCommand.execute(1, ['upload'], context);

        expect(copyFile).toHaveBeenCalled();
        expect(result.output).toEqual(['        1 file(s) uploaded.']);
        expect(filesystem.readFile('NOTES.TXT')).toBe('hello');
    });

    it('surfaces a DOS filename error instead of silently mangling the name', async (): Promise<void> => {
        pickTextFile.mockResolvedValue({
            name: 'a-very-long-filename.txt',
            content: 'hello',
        });
        const filesystem = new DosFileSystem();
        const context: CommandContext = {
            dispatch: vi.fn() as any,
            filesystem,
        };

        const result = await uploadCommand.execute(1, ['upload'], context);

        expect(result.output?.[0]).toContain('syntax is incorrect');
    });
});
