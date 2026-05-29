import type { ConCommandReactor } from '@/console/ConCommandRegistry';

export const echoCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => argv[0]?.toLowerCase() === 'echo',
    execute: (_argc, argv): { output: string[] } => ({
        output: [argv.slice(1).join(' ')],
    }),
};
