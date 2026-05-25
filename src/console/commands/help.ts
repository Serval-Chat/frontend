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
    mode: ['Displays console device status.'],
    cd: ['Displays the name of or changes the current directory.'],
    dir: ['Displays a list of files and subdirectories in a directory.'],
    mkdir: ['Creates a directory.'],
    md: ['Creates a directory.'],
    rmdir: ['Removes a directory.'],
    copy: ['Copies one file to another location.'],
    move: ['Moves files and renames files and directories.'],
    ren: ['Renames a file or files.'],
    rename: ['Renames a file or files.'],
    del: ['Deletes one or more files.'],
    erase: ['Deletes one or more files.'],
    type: ['Displays the contents of a text file.'],
    more: ['Displays output one screen at a time.'],
    attrib: ['Displays or changes file attributes.'],
    edit: ['Starts the MS-DOS Editor for creating and changing text files.'],
    run: ['Runs a file or script in the console.', '', 'RUN [filename]'],
    snake: ['Plays snake game'],
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
                '  MODE     - Displays console dimensions',
                '  CD       - Changes the current directory',
                '  DIR      - Lists directory contents',
                '  MD       - Creates a directory',
                '  RMDIR    - Removes a directory',
                '  COPY     - Copies files',
                '  MOVE     - Moves files',
                '  REN      - Renames files',
                '  DEL      - Deletes files',
                '  TYPE     - Displays file contents',
                '  MORE     - Displays file contents',
                '  ATTRIB   - Displays or changes file attributes',
                '  EDIT     - Edits a text file',
                '  RUN      - Runs a file',
                '  SNAKE    - Plays a snake game',
                '  USERCTL  - Queries user profiles and friend list',
            ],
        };
    },
};
