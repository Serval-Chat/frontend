import type { ConCommandReactor } from '@/console/ConCommandRegistry';
import type { DosEntry } from '@/console/DosFileSystem';

type CommandContext = Parameters<ConCommandReactor['execute']>[2];
type CommandFilesystem = NonNullable<CommandContext['filesystem']>;

const requireFilesystem = (context: CommandContext): CommandFilesystem => {
    if (!context.filesystem) throw new Error('File system is not available.');
    return context.filesystem;
};

const commandName = (argv: string[]): string => argv[0]?.toUpperCase() ?? '';

const oneOrMore = (argv: string[], usage: string): string => {
    const value = argv.slice(1).join(' ');
    if (!value) throw new Error(usage);
    return value;
};

const fileSize = (entry: DosEntry): number => entry.content?.length ?? 0;

const formatDirDate = (value: string): string => {
    const date = new Date(value);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(
        date.getDate(),
    ).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}  ${String(
        date.getHours(),
    ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const formatDirLine = (entry: DosEntry): string => {
    const name = entry.name.split('.');
    const base = (name[0] ?? '').padEnd(8, ' ');
    const extension = (name[1] ?? '').padEnd(3, ' ');
    const marker =
        entry.type === 'directory'
            ? '<DIR>'.padStart(10, ' ')
            : String(fileSize(entry)).padStart(10, ' ');
    return `${formatDirDate(entry.modifiedAt)}    ${marker} ${base} ${extension}`;
};

const formatAttrib = (entry: DosEntry): string => {
    const attrs = ['A', 'S', 'H', 'R']
        .map((attribute): string =>
            entry.attributes.includes(
                attribute as DosEntry['attributes'][number],
            )
                ? attribute
                : ' ',
        )
        .join('  ');
    return `${attrs}     ${entry.path}`;
};

const withError = (
    run: () => { output?: string[]; clear?: boolean },
): { output?: string[]; clear?: boolean } => {
    try {
        return run();
    } catch (error) {
        return {
            output: [error instanceof Error ? error.message : String(error)],
        };
    }
};

const cdCommand: ConCommandReactor = {
    match: (_argc, argv): boolean =>
        ['CD', 'CHDIR'].includes(commandName(argv)),
    execute: (_argc, argv, context): { output?: string[]; clear?: boolean } =>
        withError((): { output: string[] } | { output?: undefined } => {
            const fs = requireFilesystem(context);
            if (argv.length === 1) return { output: [fs.getCwd()] };
            fs.changeDirectory(argv.slice(1).join(' '));
            return {};
        }),
};

const dirCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => commandName(argv) === 'DIR',
    execute: (_argc, argv, context): { output?: string[]; clear?: boolean } =>
        withError((): { output: string[] } => {
            const fs = requireFilesystem(context);
            const entries = fs.list(argv.slice(1).join(' ') || '*');
            const files = entries.filter(
                (entry): boolean => entry.type === 'file',
            );
            const directories = entries.filter(
                (entry): boolean => entry.type === 'directory',
            );
            const bytes = files.reduce(
                (total, entry): number => total + fileSize(entry),
                0,
            );
            return {
                output: [
                    ` Volume in drive C is SERCHAT`,
                    ` Directory of ${fs.getCwd()}`,
                    '',
                    ...entries.map(formatDirLine),
                    `${String(files.length).padStart(16, ' ')} File(s) ${String(
                        bytes,
                    ).padStart(14, ' ')} bytes`,
                    `${String(directories.length).padStart(
                        16,
                        ' ',
                    )} Dir(s)  2147483647 bytes free`,
                ],
            };
        }),
};

const mkdirCommand: ConCommandReactor = {
    match: (_argc, argv): boolean =>
        ['MD', 'MKDIR'].includes(commandName(argv)),
    execute: (_argc, argv, context): { output?: string[]; clear?: boolean } =>
        withError((): Record<string, never> => {
            const fs = requireFilesystem(context);
            fs.makeDirectory(
                oneOrMore(argv, 'The syntax of the command is incorrect.'),
            );
            return {};
        }),
};

const rmdirCommand: ConCommandReactor = {
    match: (_argc, argv): boolean =>
        ['RD', 'RMDIR'].includes(commandName(argv)),
    execute: (_argc, argv, context): { output?: string[]; clear?: boolean } =>
        withError((): Record<string, never> => {
            const fs = requireFilesystem(context);
            fs.removeDirectory(
                oneOrMore(argv, 'The syntax of the command is incorrect.'),
            );
            return {};
        }),
};

const copyCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => commandName(argv) === 'COPY',
    execute: (_argc, argv, context): { output?: string[]; clear?: boolean } =>
        withError((): { output: string[] } => {
            if (argv.length < 3)
                throw new Error('The syntax of the command is incorrect.');
            const fs = requireFilesystem(context);
            fs.copy(argv[1] ?? '', argv[2] ?? '');
            return { output: ['        1 file(s) copied.'] };
        }),
};

const moveCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => commandName(argv) === 'MOVE',
    execute: (_argc, argv, context): { output?: string[]; clear?: boolean } =>
        withError((): { output: string[] } => {
            if (argv.length < 3)
                throw new Error('The syntax of the command is incorrect.');
            const fs = requireFilesystem(context);
            fs.move(argv[1] ?? '', argv[2] ?? '');
            return { output: ['        1 file(s) moved.'] };
        }),
};

const renameCommand: ConCommandReactor = {
    match: (_argc, argv): boolean =>
        ['REN', 'RENAME'].includes(commandName(argv)),
    execute: (_argc, argv, context): { output?: string[]; clear?: boolean } =>
        withError((): Record<string, never> => {
            if (argv.length < 3)
                throw new Error('The syntax of the command is incorrect.');
            const fs = requireFilesystem(context);
            fs.rename(argv[1] ?? '', argv[2] ?? '');
            return {};
        }),
};

const deleteCommand: ConCommandReactor = {
    match: (_argc, argv): boolean =>
        ['DEL', 'ERASE'].includes(commandName(argv)),
    execute: (_argc, argv, context): { output?: string[]; clear?: boolean } =>
        withError((): Record<string, never> => {
            const fs = requireFilesystem(context);
            fs.delete(
                oneOrMore(argv, 'The syntax of the command is incorrect.'),
            );
            return {};
        }),
};

const typeCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => commandName(argv) === 'TYPE',
    execute: (_argc, argv, context): { output?: string[]; clear?: boolean } =>
        withError((): { output: string[] } => {
            const fs = requireFilesystem(context);
            return {
                output: fs
                    .readFile(
                        oneOrMore(
                            argv,
                            'The syntax of the command is incorrect.',
                        ),
                    )
                    .split('\n'),
            };
        }),
};

const moreCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => commandName(argv) === 'MORE',
    execute: typeCommand.execute,
};

const attribCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => commandName(argv) === 'ATTRIB',
    execute: (_argc, argv, context): { output?: string[]; clear?: boolean } =>
        withError((): { output: string[] } => {
            const fs = requireFilesystem(context);
            const args = argv.slice(1);
            const changes = args.filter((arg): boolean =>
                /^[+-][ASHRashr]$/.test(arg),
            );
            const targets = args.filter(
                (arg): boolean => !/^[+-][ASHRashr]$/.test(arg),
            );
            const entries = fs.setAttributes(targets.join(' ') || '*', changes);
            return { output: entries.map(formatAttrib) };
        }),
};

export const filesystemCommands = [
    cdCommand,
    dirCommand,
    mkdirCommand,
    rmdirCommand,
    copyCommand,
    moveCommand,
    renameCommand,
    deleteCommand,
    typeCommand,
    moreCommand,
    attribCommand,
];
