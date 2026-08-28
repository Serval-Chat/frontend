import type { ConCommandReactor } from '@/console/ConCommandRegistry';
import { SnakeProgram } from '@/console/programs/SnakeProgram';

export const snakeCommand: ConCommandReactor = {
    match: (_argc, argv): boolean => argv[0]?.toLowerCase() === 'snake',
    execute: (
        _argc,
        _argv,
        context,
    ): { output: string[] } | { output?: undefined } => {
        if (!context.terminal || !context.startProgram || !context.endProgram) {
            return {
                output: [
                    'Error: Console does not support interactive commands.',
                ],
            };
        }

        context.startProgram(
            new SnakeProgram({
                terminal: context.terminal,
                onExit: context.endProgram,
            }),
        );

        return {};
    },
};
