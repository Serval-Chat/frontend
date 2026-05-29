import type { ConCommandReactor } from '@/console/ConCommandRegistry';

export const fallbackCommand: ConCommandReactor = {
    match: (): false => false,
    execute: (): Record<string, never> => ({}),
    default: (_argc, argv): { output: string[] } => ({
        output: [
            `'${argv[0]}' is not recognized as an internal or external command,`,
            'operable program or batch file.',
        ],
    }),
};
