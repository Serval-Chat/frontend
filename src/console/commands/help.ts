import type { ConCommandReactor } from '@/console/ConCommandRegistry';

const HELP_DETAILS: Record<string, string[]> = {
    echo: [
        'Displays messages, or turns command-echoing on or off.',
        '',
        'ECHO [message]',
    ],
    cls: ['Clears the screen.'],
    ver: ['Displays the Windows NT version.'],
    help: [
        'Provides Help information for Windows NT commands.',
        '',
        'HELP [command]',
    ],
    date: ['Displays or sets the date.'],
    time: ['Displays or sets the system time.'],
    run: ['Runs a file or script in the console.', '', 'RUN [filename]'],
};

export const helpCommand: ConCommandReactor = {
    match: (_argc, argv) => argv[0]?.toLowerCase() === 'help',
    execute: (argc, argv) => {
        if (argc > 1) {
            const cmd = argv[1].toLowerCase();
            if (cmd === 'userctl') {
                return {
                    mutateTo: 'userctl /?',
                };
            }
            if (HELP_DETAILS[cmd]) {
                return {
                    output: HELP_DETAILS[cmd],
                };
            }
            return {
                output: [
                    `This command is not supported by the help utility.`,
                    `Try "${argv[1]} /?".`,
                ],
            };
        }

        return {
            output: [
                'Provides Help information for Windows NT commands.',
                '',
                'HELP [command]',
                '',
                '  command - displays help information on that command.',
                '',
                'Supported commands:',
                '  ECHO     - Displays messages',
                '  CLS      - Clears the screen',
                '  VER      - Displays the Windows NT version',
                '  HELP     - Displays this help message',
                '  DATE     - Displays the current date',
                '  TIME     - Displays the current time',
                '  RUN      - Runs a file',
                '  USERCTL  - Queries user profiles and friend list',
            ],
        };
    },
};
