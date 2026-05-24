import type {
    CommandResult,
    ConCommandReactor,
} from '@/console/ConCommandRegistry';

export const progressCommand: ConCommandReactor = {
    match: (_argc, argv) => argv[0]?.toLowerCase() === 'progress',
    execute: async (_argc, _argv, context): Promise<CommandResult> => {
        const { writeLine } = context;
        if (!writeLine) {
            return { output: ['Error: writeLine not available'] };
        }

        const reset = '\u001b[0m';
        const green = '\u001b[32m';
        const yellow = '\u001b[33m';
        const red = '\u001b[31m';
        const bold = '\u001b[1m';

        for (let i = 0; i <= 100; i += 2) {
            const width = 50;
            const filled = Math.floor((i / 100) * width);
            const empty = width - filled;

            let color = green;
            if (i >= 66) color = red;
            else if (i >= 33) color = yellow;

            const bar = `[${color}${bold}${'█'.repeat(filled)}${reset}${'░'.repeat(empty)}] ${bold}${i}%${reset}`;

            writeLine(`\r\u001b[0K${bar}`);

            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        return { output: [] };
    },
};
