import type { ConCommandReactor } from '@/console/ConCommandRegistry';

export const dateCommand: ConCommandReactor = {
    match: (_argc, argv) => argv[0]?.toLowerCase() === 'date',
    execute: () => {
        const today = new Date();
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        };
        return {
            output: [
                `The current date is: ${today.toLocaleDateString('en-US', options)}`,
            ],
        };
    },
};
