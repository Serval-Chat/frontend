import { friendsApi } from '@/api/friends/friends.api';
import { usersApi } from '@/api/users/users.api';
import type { User } from '@/api/users/users.types';
import type { ConCommandReactor } from '@/console/ConCommandRegistry';
import {
    getAnsiColoredBadge,
    getAnsiDisplayName,
    getAnsiUsername,
} from '@/console/utils/colorUtils';
import { formatTable } from '@/console/utils/tableFormatter';

const USAGE = [
    'Queries user profiles and friend accounts.',
    '',
    'USERCTL /query friends [/filter:columns] [/hide-empty] [/require-all]',
    '',
    "  /query friends     Queries current user's friends list.",
    '  /filter:columns    Specifies columns to display (comma-separated).',
    '                     Default: uname,dname',
    '                     Available columns:',
    '                       uname    - Username',
    '                       dname    - Display Name',
    '                       pronouns - User Pronouns',
    '                       bio      - About Me',
    '                       unamefnt - Custom username font family',
    '                       webconn  - Verified website connections',
    '                       badges   - User System Badges',
    '  /hide-empty        Filters out rows that have no visual data in the',
    '                     selected columns.',
    '  /require-all       Requires all selected columns to have visual data',
    '                     to display a row.',
];

export const userctlCommand: ConCommandReactor = {
    match: (_argc, argv) => argv[0]?.toLowerCase() === 'userctl',
    execute: async (argc, argv, context) => {
        const showHelp =
            argc === 1 ||
            argv.includes('/?') ||
            argv.includes('/help') ||
            argv.includes('-h') ||
            argv.includes('--help');

        if (showHelp) {
            return {
                output: USAGE,
            };
        }

        const operand = argv[1];

        if (operand !== '/query') {
            return {
                output: [`userctl: invalid operand '${operand}'`, '', ...USAGE],
            };
        }

        if (argc === 2) {
            return {
                output: ['userctl: missing target for /query', '', ...USAGE],
            };
        }

        const target = argv[2];

        if (target !== 'friends') {
            return {
                output: [`userctl: invalid target '${target}'`, '', ...USAGE],
            };
        }

        const hideEmpty = argv.includes('/hide-empty');
        const requireAll = argv.includes('/require-all');
        let selectedFields = ['uname', 'dname'];
        const filterArg = argv.find((arg) => arg.startsWith('/filter:'));

        if (filterArg) {
            const fieldsStr = filterArg.substring('/filter:'.length);
            if (!fieldsStr) {
                return {
                    output: [
                        'userctl: filter requires at least one field',
                        '',
                        ...USAGE,
                    ],
                };
            }
            const fields = fieldsStr.split(',');
            const allowed = [
                'uname',
                'dname',
                'pronouns',
                'bio',
                'unamefnt',
                'webconn',
                'badges',
            ];
            for (const field of fields) {
                if (!allowed.includes(field)) {
                    return {
                        output: [
                            `userctl: invalid filter field '${field}'`,
                            '',
                            ...USAGE,
                        ],
                    };
                }
            }
            selectedFields = fields;
        }

        const extraArgs = argv
            .slice(3)
            .filter(
                (arg) =>
                    !arg.startsWith('/filter:') &&
                    arg !== '/hide-empty' &&
                    arg !== '/require-all',
            );
        if (extraArgs.length > 0) {
            return {
                output: [
                    `userctl: invalid operand '${extraArgs[0]}'`,
                    '',
                    ...USAGE,
                ],
            };
        }

        try {
            if (context.writeLine) {
                context.writeLine('userctl: Querying friend records...');
            }
            const baseProfiles = await friendsApi.getFriendProfiles();
            const profileIds = baseProfiles.map((p) => p._id);
            const needsBadgeData = selectedFields.includes('badges');

            if (needsBadgeData && context.writeLine) {
                context.writeLine(
                    `userctl: Fetching badge data for ${profileIds.length} friends...`,
                );
            }

            const profiles = needsBadgeData
                ? await Promise.all(
                      profileIds.map(async (id) => {
                          const fullProfile = await usersApi.getById(id);
                          if (context.writeLine) {
                              context.writeLine(
                                  `userctl: Parsing user ${fullProfile.username}... Found ${fullProfile.badges?.length || 0} badges.`,
                              );
                          }
                          return fullProfile;
                      }),
                  )
                : baseProfiles;

            if (profiles.length === 0) {
                return {
                    output: [
                        '-------------------------------------------------------',
                        'No friends found.',
                        '-------------------------------------------------------',
                    ],
                };
            }

            const columns = selectedFields.map((field) => {
                switch (field) {
                    case 'uname':
                        return {
                            header: '\u001b[96mUsername\u001b[0m',
                            key: (u: User) => getAnsiUsername(u),
                        };
                    case 'pronouns':
                        return {
                            header: '\u001b[96mPronouns\u001b[0m',
                            key: (u: User) => u.pronouns || '',
                        };
                    case 'badges':
                        return {
                            header: '\u001b[96mBadges\u001b[0m',
                            key: (u: User) =>
                                u.badges && u.badges.length > 0
                                    ? u.badges
                                          .map((b) =>
                                              getAnsiColoredBadge(
                                                  b.name,
                                                  b.color,
                                              ),
                                          )
                                          .join(', ')
                                    : '',
                        };
                    case 'dname':
                        return {
                            header: '\u001b[96mDisplay Name\u001b[0m',
                            key: (u: User) => getAnsiDisplayName(u),
                        };
                    case 'bio':
                        return {
                            header: '\u001b[96mBio\u001b[0m',
                            key: (u: User) => u.bio || '',
                        };
                    case 'unamefnt':
                        return {
                            header: '\u001b[96mFont\u001b[0m',
                            key: (u: User) => u.usernameFont || '',
                        };
                    case 'webconn':
                        return {
                            header: '\u001b[96mConnections\u001b[0m',
                            key: (u: User) =>
                                u.connections?.map((c) => c.value).join(', ') ||
                                '',
                        };

                    default:
                        return {
                            header: '',
                            key: () => '',
                        };
                }
            });

            let filteredProfiles = profiles;
            if (requireAll) {
                filteredProfiles = profiles.filter((p) =>
                    columns.every((col) => {
                        const val = col.key(p);
                        const visualVal = val
                            ? String(val)
                                  // eslint-disable-next-line no-control-regex
                                  .replace(/\u001b\[[0-9;]*m/g, '')
                                  .trim()
                            : '';
                        return visualVal !== '';
                    }),
                );
            } else if (hideEmpty) {
                filteredProfiles = profiles.filter((p) =>
                    columns.some((col) => {
                        const val = col.key(p);
                        const visualVal = val
                            ? String(val)
                                  // eslint-disable-next-line no-control-regex
                                  .replace(/\u001b\[[0-9;]*m/g, '')
                                  .trim()
                            : '';
                        return visualVal !== '';
                    }),
                );
            }

            if (filteredProfiles.length === 0) {
                return {
                    output: [
                        '-------------------------------------------------------',
                        'No matching friends found (all records are empty).',
                        '-------------------------------------------------------',
                    ],
                };
            }

            const tableLines = formatTable(filteredProfiles, columns);

            return {
                output: [
                    ...tableLines,
                    `Total friends: ${filteredProfiles.length}`,
                ],
            };
        } catch (error) {
            return {
                output: [
                    'userctl: failed to fetch friends list',
                    error instanceof Error ? error.message : String(error),
                ],
            };
        }
    },
};
