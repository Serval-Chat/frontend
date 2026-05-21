import type { ConCommandReactor } from '@/console/ConCommandRegistry';

export const fallbackCommand: ConCommandReactor = {
    match: () => false,
    execute: () => ({}),
    default: (_argc, argv) => ({
        output: [
            `'${argv[0]}' is not recognized as an internal or external command,`,
            'operable program or batch file.',
        ],
    }),
};
