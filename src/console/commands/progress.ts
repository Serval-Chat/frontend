import type {
    CommandResult,
    ConCommandReactor,
} from '@/console/ConCommandRegistry';

export const progressCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => argv[0]?.toLowerCase() === 'progress',
    execute: async (_argc, _argv, context): Promise<CommandResult> => {
        const { terminal } = context;
        if (!terminal) {
            return { output: ['Error: terminal not available'] };
        }

        const reset = '\u001b[0m';
        const green = '\u001b[32m';
        const yellow = '\u001b[33m';
        const red = '\u001b[31m';
        const bold = '\u001b[1m';

        for (let i = 0; i <= 100; i += 2) {
            const width = Math.max(
                10,
                Math.min(50, terminal.getColumns() - 10),
            );
            const filled = Math.floor((i / 100) * width);
            const empty = width - filled;

            let color = green;
            if (i >= 66) color = red;
            else if (i >= 33) color = yellow;

            const bar = `[${color}${bold}${'█'.repeat(filled)}${reset}${'░'.repeat(empty)}] ${bold}${i}%${reset}`;

            terminal.write(`\r\u001b[0K${bar}`);

            await new Promise(
                (resolve): NodeJS.Timeout => setTimeout(resolve, 50),
            );
        }

        terminal.puts();
        return { output: [] };
    },
};
