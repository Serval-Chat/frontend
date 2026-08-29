import type { ConCommandReactor } from '@/console/ConCommandRegistry';
import { resetSystemIdentity } from '@/console/systemIdentity';

export const formatCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => argv[0]?.toLowerCase() === 'format',
    execute: (_argc, argv, context): { output: string[] } => {
        const drive = (argv[1] ?? '').toUpperCase().replace(/:$/, '');
        const confirmed = argv
            .slice(2)
            .some((arg): boolean => arg.toUpperCase() === '/Y');

        if (!drive) {
            return {
                output: [
                    'Required parameter missing - drive specification.',
                    '',
                    'FORMAT drive: [/Y]',
                ],
            };
        }

        if (drive !== 'C') {
            return { output: ['Invalid drive specification'] };
        }

        if (!confirmed) {
            return {
                output: [
                    'Insert new diskette for drive C:',
                    'and press ENTER when ready...',
                    '',
                    'WARNING, ALL DATA ON NON-REMOVABLE DISK',
                    'DRIVE C: WILL BE LOST!',
                    '',
                    'Type FORMAT C: /Y to confirm, or anything else to cancel.',
                ],
            };
        }

        if (!context.filesystem) {
            return {
                output: ['FORMAT: console does not support the filesystem.'],
            };
        }

        context.filesystem.reset();
        resetSystemIdentity();

        return {
            output: [
                'Formatting 1.4M',
                'Format complete.',
                '',
                'Serchat Console filesystem has been reset.',
                'System identity has been reset - a new machine',
                'identity will be generated automatically.',
                '',
                '1,474,560 bytes total disk space',
                '1,474,560 bytes available on disk',
            ],
        };
    },
};
