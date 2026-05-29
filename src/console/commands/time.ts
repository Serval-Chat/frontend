import type { ConCommandReactor } from '@/console/ConCommandRegistry';

export const timeCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => argv[0]?.toLowerCase() === 'time',
    execute: (): { output: string[] } => {
        const today = new Date();
        return {
            output: [
                `The current time is: ${today.toLocaleTimeString('en-US')}`,
            ],
        };
    },
};
