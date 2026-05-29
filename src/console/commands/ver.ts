import type { ConCommandReactor } from '@/console/ConCommandRegistry';

export const verCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => argv[0]?.toLowerCase() === 'ver',
    execute: (): { output: string[] } => ({
        output: ['Serchat Console NT(TM) [Version 10.0.26100]'],
    }),
};
