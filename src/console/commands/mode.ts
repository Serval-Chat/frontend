import type { ConCommandReactor } from '@/console/ConCommandRegistry';

export const modeCommand: ConCommandReactor = {
    match: (_argc, argv) => argv[0]?.toLowerCase() === 'mode',
    execute: (_argc, _argv, context) => {
        const size = context.terminal?.getSize();
        if (!size) {
            return { output: ['MODE: terminal dimensions are unavailable.'] };
        }

        return {
            output: [
                'Status for device CON:',
                '----------------------',
                `    Columns:     ${size.columns}`,
                `    Lines:       ${size.rows}`,
            ],
        };
    },
};
