import type { ConCommandReactor } from '@/console/ConCommandRegistry';

export const runCommand: ConCommandReactor = {
    match: (_argc, argv) => argv[0]?.toLowerCase() === 'run',
    execute: (_argc, argv) => {
        const file = argv[1];
        if (!file) {
            return { output: ['Usage: run <filename>'] };
        }
        return { output: [`Running ${file}...`] };
    },
};
