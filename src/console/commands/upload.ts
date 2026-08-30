import type {
    CommandContext,
    CommandResult,
    ConCommandReactor,
} from '@/console/ConCommandRegistry';
import { pickTextFile } from '@/console/utils/filePicker';

const requireFilesystem = (
    context: CommandContext,
): NonNullable<CommandContext['filesystem']> => {
    if (!context.filesystem) throw new Error('File system is not available.');
    return context.filesystem;
};

const describeDestination = (
    fs: NonNullable<CommandContext['filesystem']>,
    destination: string,
): string => {
    if (/[\\:]/.test(destination)) return destination.toUpperCase();
    const cwd = fs.getCwd();
    return `${cwd}${cwd.endsWith('\\') ? '' : '\\'}${destination.toUpperCase()}`;
};

export const uploadCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => argv[0]?.toUpperCase() === 'UPLOAD',
    execute: async (_argc, argv, context): Promise<CommandResult> => {
        try {
            const fs = requireFilesystem(context);
            const picked = await pickTextFile();
            if (!picked) return { output: ['Upload cancelled.'] };

            const destination = argv.slice(1).join(' ') || picked.name;

            if (context.copyFile) {
                const { cancelled } = await context.copyFile({
                    fileName: picked.name,
                    from: 'Your Computer',
                    to: describeDestination(fs, destination),
                    size: picked.content.length,
                });
                if (cancelled) return { output: ['Upload cancelled.'] };
            }

            fs.writeFile(destination, picked.content);
            return { output: ['        1 file(s) uploaded.'] };
        } catch (error) {
            return {
                output: [
                    error instanceof Error ? error.message : String(error),
                ],
            };
        }
    },
};
