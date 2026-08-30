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
    upload: [
        'Uploads a text file from your device into the console filesystem.',
        '',
        'UPLOAD [destination]',
        '',
        '  destination - optional filename to save as, defaults to the',
        "                uploaded file's own name.",
    ],
    run: ['Runs a file or script in the console.', '', 'RUN [filename]'],
    snake: ['Plays snake game'],
    ansitest: ['Displays all supported ANSI color and style codes.'],
    fastfetch: [
        'Displays a summary of system information.',
        '',
        'FASTFETCH [/filter:modules] [/list] [/?]',
    ],
    basic: [
        'Starts the Serchat BASIC interpreter.',
        '',
        'BASIC [filename]',
        '',
        '  filename - optionally loads a .BAS file on start.',
        '',
        'Type a line starting with a number to add it to the program,',
        'e.g. 10 PRINT "HELLO". Type it again with nothing after the',
        'number to delete that line. Type a statement with no line',
        'number to run it immediately.',
        '',
        'RUN, LIST, NEW, SAVE filename, LOAD filename, SYSTEM (exit).',
        'Ctrl+C breaks a running program.',
        '',
        'COLOR fg[, bg] sets text color (0-15 fg, 0-7 bg, classic',
        'CGA palette). SLEEP [seconds] pauses (default 1, fractions',
        'allowed). SCRWIDTH() and SCRHEIGHT() return the live',
        'terminal size in characters. LOCATE row, col moves the',
        'cursor for absolute-position drawing without scrolling.',
    ],
    format: [
        'Formats a disk for use with Serchat Console.',
        '',
        'FORMAT drive: [/Y]',
        '',
        '  drive: - the drive to format (only C: exists).',
        '  /Y     - confirms the format without prompting again.',
        '',
        'Wipes the console filesystem and system identity, giving',
        'a fresh install on next FASTFETCH/DIR.',
    ],
};

export const helpCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => argv[0]?.toLowerCase() === 'help',
    execute: (argc, argv) => {
        if (argc > 1) {
            const cmd = (argv[1] ?? '').toLowerCase();
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
                '  UPLOAD   - Uploads a file from your device',
                '  RUN      - Runs a file',
                '  SNAKE    - Plays a snake game',
                '  ANSITEST - Displays all supported ANSI codes',
                '  USERCTL  - Queries user profiles and friend list',
                '  FASTFETCH - Displays a summary of system information',
                '  BASIC    - Starts the Serchat BASIC interpreter',
                '  FORMAT   - Formats a disk (resets the console to a fresh install)',
            ],
        };
    },
};
