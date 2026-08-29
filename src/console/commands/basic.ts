import type { ConCommandReactor } from '@/console/ConCommandRegistry';
import { BasicProgram } from '@/console/programs/BasicProgram';

export const basicCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => argv[0]?.toLowerCase() === 'basic',
    execute: (
        _argc,
        argv,
        context,
    ): { output: string[] } | { output?: undefined } => {
        if (
            !context.filesystem ||
            !context.terminal ||
            !context.startProgram ||
            !context.endProgram
        ) {
            return {
                output: ['BASIC: console does not support full-screen mode.'],
            };
        }

        const initialFile = argv.slice(1).join(' ') || undefined;

        context.startProgram(
            new BasicProgram({
                filesystem: context.filesystem,
                onExit: context.endProgram,
                terminal: context.terminal,
                initialFile,
            }),
        );
        return {};
    },
};
