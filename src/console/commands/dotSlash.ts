import type { ConCommandReactor } from '@/console/ConCommandRegistry';

export const dotSlashCommand: ConCommandReactor = {
    match: (_argc, argv): boolean =>
        argv[0]?.startsWith('.\\') || argv[0]?.startsWith('./'),
    execute: (_argc, argv): { mutateTo: string } => {
        const file = argv[0].substring(2);
        const rest = argv.slice(1).join(' ');
        return {
            mutateTo: `run ${file}${rest ? ` ${rest}` : ''}`,
        };
    },
};
