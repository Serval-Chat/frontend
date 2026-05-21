import type { ConCommandReactor } from '@/console/ConCommandRegistry';

export const echoCommand: ConCommandReactor = {
    match: (_argc, argv) => argv[0]?.toLowerCase() === 'echo',
    execute: (_argc, argv) => ({
        output: [argv.slice(1).join(' ')],
    }),
};
