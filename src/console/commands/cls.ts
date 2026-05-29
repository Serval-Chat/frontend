import type { ConCommandReactor } from '@/console/ConCommandRegistry';

export const clsCommand: ConCommandReactor = {
    match: (_argc, argv): boolean =>
        argv[0]?.toLowerCase() === 'cls' || argv[0]?.toLowerCase() === 'clear',
    execute: (): { clear: true } => ({ clear: true }),
};
