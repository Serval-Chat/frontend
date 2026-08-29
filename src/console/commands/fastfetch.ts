import packageJson from '../../../package.json';

import { usersApi } from '@/api/users/users.api';
import type { User } from '@/api/users/users.types';
import type {
    CommandContext,
    ConCommandReactor,
} from '@/console/ConCommandRegistry';
import {
    getCpu,
    getDisk,
    getGpu,
    getHostModel,
    getHostname,
    getMemory,
    getOsProfile,
    getResolution,
} from '@/console/systemIdentity';
import type { OsProfile } from '@/console/systemIdentity';

const PACKAGE_COUNT =
    Object.keys(packageJson.dependencies ?? {}).length +
    Object.keys(packageJson.devDependencies ?? {}).length;

const ESC = String.fromCharCode(27);
const RESET = `${ESC}[0m`;
const LABEL_COLOR = `${ESC}[1;36m`;
const HEADER_COLOR = `${ESC}[1;33m`;
const ART_COLOR = `${ESC}[1;37m`;

const LOGO_WIDTH = 26;
const LOGO_HEIGHT = 15;
const LOGO_GAP = '  ';

const RAW_LOGO_LINES = [
    '                        _',
    '                       | \\',
    '                       | |',
    '                       | |',
    '  |\\                   | |',
    ' /, ~\\                / /',
    'X     `-.....-------./ /',
    ' ~-. ~  ~              |',
    '    \\             /    |',
    '     \\  /_     ___\\   /',
    '     | /\\ ~~~~~   \\ |',
    '     | | \\        || |',
    '     | |\\ \\       || )',
    '    (_/ (_/      ((_/',
];

const LOGO_LINES: string[] = Array.from(
    { length: LOGO_HEIGHT },
    (_unused, index): string =>
        (RAW_LOGO_LINES[index] ?? '').padEnd(LOGO_WIDTH, ' '),
);

const formatAccountAge = (createdAt: Date | string): string => {
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) return 'unknown';

    const now = new Date();
    let years = now.getFullYear() - created.getFullYear();
    let months = now.getMonth() - created.getMonth();
    let days = now.getDate() - created.getDate();

    if (days < 0) {
        months -= 1;
        days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`);
    if (years > 0 || months > 0) {
        parts.push(`${months} month${months === 1 ? '' : 's'}`);
    }
    parts.push(`${days} day${days === 1 ? '' : 's'}`);
    return parts.join(', ');
};

interface FastfetchRuntime {
    currentUser: User | null;
    osProfile: OsProfile;
}

interface FastfetchModule {
    key: string;
    label: string;
    needsUser?: boolean;
    getValue: (context: CommandContext, runtime: FastfetchRuntime) => string;
}

const MODULES: FastfetchModule[] = [
    {
        key: 'os',
        label: 'OS',
        getValue: (_context, runtime): string => runtime.osProfile.os,
    },
    { key: 'host', label: 'Host', getValue: (): string => getHostModel() },
    {
        key: 'kernel',
        label: 'Kernel',
        getValue: (_context, runtime): string => runtime.osProfile.kernel,
    },
    {
        key: 'uptime',
        label: 'Uptime',
        needsUser: true,
        getValue: (_context, runtime): string =>
            runtime.currentUser
                ? formatAccountAge(runtime.currentUser.createdAt)
                : 'unknown (not signed in)',
    },
    {
        key: 'packages',
        label: 'Packages',
        getValue: (): string => `${PACKAGE_COUNT} (npm)`,
    },
    {
        key: 'shell',
        label: 'Shell',
        getValue: (_context, runtime): string => runtime.osProfile.shell,
    },
    {
        key: 'resolution',
        label: 'Resolution',
        getValue: (): string => getResolution(),
    },
    {
        key: 'terminal',
        label: 'Terminal',
        getValue: (context): string => {
            const size = context.terminal?.getSize();
            return size
                ? `${size.columns}x${size.rows} (Serchat Console)`
                : 'Serchat Console';
        },
    },
    { key: 'cpu', label: 'CPU', getValue: (): string => getCpu() },
    { key: 'gpu', label: 'GPU', getValue: (): string => getGpu() },
    { key: 'memory', label: 'Memory', getValue: (): string => getMemory() },
    { key: 'disk', label: 'Disk', getValue: (): string => getDisk() },
];

const MODULE_KEYS = new Set(MODULES.map((module): string => module.key));

const USAGE = [
    'Displays a summary of system information.',
    '',
    'FASTFETCH [/filter:modules] [/list] [/?]',
    '',
    '  (no arguments)     Displays all available modules.',
    '  /filter:modules    Specifies modules to display (comma-separated).',
    '                     See FASTFETCH /list for available modules.',
    '  /list              Lists available modules and their keys.',
    '  /?, /help          Displays this help message.',
];

export const fastfetchCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => argv[0]?.toLowerCase() === 'fastfetch',
    execute: async (
        _argc,
        argv,
        context,
    ): Promise<{ output: string[] }> => {
        const showHelp =
            argv.includes('/?') ||
            argv.includes('/help') ||
            argv.includes('-h') ||
            argv.includes('--help');

        if (showHelp) {
            return { output: USAGE };
        }

        if (argv.includes('/list')) {
            return {
                output: [
                    'Available fastfetch modules:',
                    '',
                    ...MODULES.map(
                        (module): string =>
                            `  ${module.key.padEnd(12)} ${module.label}`,
                    ),
                ],
            };
        }

        let selectedModules = MODULES;
        const filterArg = argv.find((arg): boolean =>
            arg.startsWith('/filter:'),
        );

        if (filterArg) {
            const fieldsStr = filterArg.slice('/filter:'.length);
            if (!fieldsStr) {
                return {
                    output: [
                        'fastfetch: filter requires at least one module',
                        '',
                        ...USAGE,
                    ],
                };
            }

            const requestedKeys = fieldsStr.split(',');
            for (const key of requestedKeys) {
                if (!MODULE_KEYS.has(key)) {
                    return {
                        output: [
                            `fastfetch: invalid module '${key}'`,
                            '',
                            ...USAGE,
                        ],
                    };
                }
            }

            const moduleByKey = new Map(
                MODULES.map((module): [string, FastfetchModule] => [
                    module.key,
                    module,
                ]),
            );
            selectedModules = requestedKeys.map(
                (key): FastfetchModule => moduleByKey.get(key) as FastfetchModule,
            );
        }

        const extraArgs = argv
            .slice(1)
            .filter(
                (arg): boolean =>
                    !arg.startsWith('/filter:') && arg !== '/list',
            );
        if (extraArgs.length > 0) {
            return {
                output: [
                    `fastfetch: invalid operand '${extraArgs[0]}'`,
                    '',
                    ...USAGE,
                ],
            };
        }

        let currentUser: User | null = null;
        if (selectedModules.some((module): boolean => !!module.needsUser)) {
            try {
                currentUser = await usersApi.getMe();
            } catch {
                currentUser = null;
            }
        }
        const runtime: FastfetchRuntime = {
            currentUser,
            osProfile: getOsProfile(),
        };

        const header = `guest@${getHostname()}`;
        const separator = '-'.repeat(header.length);

        const infoLines = [
            `${HEADER_COLOR}${header}${RESET}`,
            `${HEADER_COLOR}${separator}${RESET}`,
            ...selectedModules.map(
                (module): string =>
                    `${LABEL_COLOR}${module.label}:${RESET} ${module.getValue(context, runtime)}`,
            ),
        ];

        const rowCount = Math.max(LOGO_LINES.length, infoLines.length);
        const rows: string[] = [];
        for (let row = 0; row < rowCount; row++) {
            const logoRow = LOGO_LINES[row] ?? ' '.repeat(LOGO_WIDTH);
            const infoRow = infoLines[row] ?? '';
            rows.push(` ${ART_COLOR}${logoRow}${RESET}${LOGO_GAP}${infoRow}`);
        }

        return {
            output: ['', ...rows, ''],
        };
    },
};
